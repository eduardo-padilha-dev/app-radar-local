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
    await this.prisma.$transaction(
      async (tx) => {
        // Hold the same user row that deactivation updates until the session is stored.
        const activeUsers = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM users WHERE id = ${id}::uuid AND "isActive" FOR UPDATE
        `;
        if (activeUsers.length === 0) throw new UnauthorizedException();

        await tx.authSession.create({
          data: { id: sessionId, userId: id, expiresAt },
        });
      },
      { isolationLevel: 'ReadCommitted' },
    );
    return { profile: { id, name, role }, token, expiresAt };
  }

  async deactivateAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: false },
        });
        await tx.authSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      },
      { isolationLevel: 'ReadCommitted' },
    );
  }

  async authenticate(token: string): Promise<SessionProfile> {
    const claims = await this.verifySessionClaims(token);
    if (!claims) throw new UnauthorizedException();

    const { sub, sid } = claims;
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

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;

    const claims = await this.verifySessionClaims(token);
    if (!claims) return;

    const { sub, sid } = claims;
    const revokedAt = new Date();
    await this.prisma.authSession.updateMany({
      where: {
        id: sid,
        userId: sub,
        revokedAt: null,
        expiresAt: { gt: revokedAt },
      },
      data: { revokedAt },
    });
  }

  private async verifySessionClaims(
    token: string,
  ): Promise<SessionClaims | undefined> {
    const claims = await this.jwt
      .verifyAsync<SessionClaims>(token, { clockTimestamp: Date.now() / 1000 })
      .catch(() => undefined);
    if (claims && isUUID(claims.sub) && isUUID(claims.sid, '4')) {
      return claims;
    }
  }
}
