import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { ResendEmailService } from '../../integrations/resend/resend-email.service.js';
import { PasswordHasher } from './password-hasher.js';
import { VerificationToken } from './verification-token.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { RegistrationResult } from './dto/registration-result.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PasswordHasher) private readonly passwords: PasswordHasher,
    @Inject(VerificationToken) private readonly tokens: VerificationToken,
    @Inject(ResendEmailService) private readonly email: ResendEmailService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async register(input: RegisterDto): Promise<RegistrationResult> {
    const passwordHash = await this.passwords.hash(input.password);
    const phone = input.phone
      ?.trim()
      .replace(/^\+55/, '')
      .replace(/[\s()-]/g, '');
    const issuance = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          phone: phone || null,
          role: 'DEVELOPER',
          isActive: true,
          emailVerifiedAt: null,
          demoUsedAt: null,
          accessExpiresAt: null,
        },
      });
      const token = this.tokens.issue();
      await tx.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt,
        },
      });
      return { email: user.email, token: token.token };
    });
    const link = new URL(
      '/confirmar-email',
      this.config.getOrThrow<string>('WEB_URL'),
    );
    link.searchParams.set('token', issuance.token);
    await this.email.sendVerificationEmail(issuance.email, link.toString());
    return { accountCreated: true, verificationEmailStatus: 'accepted' };
  }
}
