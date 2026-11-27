import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SessionProfile } from './dto/session-profile.dto.js';
import { PasswordHasher } from './password-hasher.js';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const profileFields = { id: true, name: true, role: true } as const;

interface SessionClaims {
  sub: string;
  sid: string;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const account = await this.prisma.user.findUnique({
      where: { email },
      select: { ...profileFields, isActive: true, passwordHash: true },
    });
    const passwordMatches = await this.passwordHasher.verify(
      password,
      account?.passwordHash,
    );
    if (!account?.isActive || !passwordMatches) {
      throw new UnauthorizedException();
    }

    const { id, name, role } = account;
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const sessionId = randomUUID();
    const token = await this.jwt.signAsync({
      sub: id,
      sid: sessionId,
      exp: expiresAt.getTime() / 1000,
    });
    await this.prisma.authSession.create({
      data: { id: sessionId, userId: id, expiresAt },
    });
    return { profile: { id, name, role }, token, expiresAt };
  }

  async authenticate(token: string): Promise<SessionProfile> {
    const { sub, sid } = await this.jwt
      .verifyAsync<SessionClaims>(token, { clockTimestamp: Date.now() / 1000 })
      .catch(() => {
        throw new UnauthorizedException();
      });
    if (!isUUID(sub) || !isUUID(sid, '4')) {
      throw new UnauthorizedException();
    }

    const session = await this.prisma.authSession.findFirst({
      where: {
        id: sid,
        userId: sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      select: { user: { select: profileFields } },
    });
    if (!session) throw new UnauthorizedException();

    return session.user;
  }
}
