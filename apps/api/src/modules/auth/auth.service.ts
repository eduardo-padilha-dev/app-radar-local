import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ResendEmailService } from '../../integrations/resend/resend-email.service.js';
import { PasswordHasher } from './password-hasher.js';
import { VerificationEmailUnconfirmedException } from './verification-email-unconfirmed.exception.js';
import { VerificationToken } from './verification-token.js';
import type { EmailVerificationResult } from './dto/email-verification-result.dto.js';
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
    const issuance = await this.prisma
      .$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            phone: input.phone || null,
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
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const adapterError = error.meta?.driverAdapterError as
            { cause?: { constraint?: { index?: string } } } | undefined;
          if (adapterError?.cause?.constraint?.index === 'users_email_key') {
            throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED' });
          }
        }
        throw error;
      });
    const link = new URL(
      '/confirmar-email',
      this.config.getOrThrow<string>('WEB_URL'),
    );
    link.searchParams.set('token', issuance.token);
    try {
      await this.email.sendVerificationEmail(issuance.email, link.toString());
    } catch (cause) {
      throw new VerificationEmailUnconfirmedException(cause);
    }
    return { accountCreated: true, verificationEmailStatus: 'accepted' };
  }

  async verifyEmail(token: string): Promise<EmailVerificationResult> {
    const tokenHash = this.tokens.hash(token);

    return this.prisma.$transaction<EmailVerificationResult>(async (tx) => {
      const candidate = await tx.emailVerification.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });
      if (!candidate) throw new NotFoundException();

      // Lock the account before reading the state shared by confirmation and issuance.
      await tx.$queryRaw`
        SELECT id FROM users WHERE id = ${candidate.userId}::uuid FOR UPDATE
      `;

      const verification = await tx.emailVerification.findUnique({
        where: { tokenHash, userId: candidate.userId },
        include: { user: { select: { email: true, emailVerifiedAt: true } } },
      });
      const now = new Date(Date.now());
      if (
        !verification ||
        verification.email !== verification.user.email ||
        verification.usedAt !== null ||
        verification.user.emailVerifiedAt !== null ||
        verification.expiresAt <= now
      ) {
        throw new NotFoundException();
      }

      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: now },
      });
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: now },
      });
      return { status: 'confirmed' };
    });
  }
}
