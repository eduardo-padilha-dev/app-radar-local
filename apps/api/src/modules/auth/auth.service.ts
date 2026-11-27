import { setTimeout as delay } from 'node:timers/promises';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../../generated/prisma/client.js';
import { PublicApiException } from '../../common/api-exception.filter.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ResendEmailService } from '../../integrations/resend/resend-email.service.js';
import { PasswordHasher } from './password-hasher.js';
import { VerificationEmailUnconfirmedException } from './verification-email-unconfirmed.exception.js';
import { VerificationToken } from './verification-token.js';
import type { EmailVerificationResult } from './dto/email-verification-result.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { RegistrationResult } from './dto/registration-result.dto.js';
import {
  type ResendVerificationResult,
  verificationResendIntervalSeconds,
} from './dto/resend-verification-result.dto.js';

const resendTransactionOptions = { maxWait: 1_000, timeout: 3_000 };
const resendStatementTimeoutMs = 1_000;
// Budget for transaction acquisition, execution, an in-flight statement,
// the adapter's 10-second timeout, and one second for application overhead.
const resendResponseWindowMs =
  resendTransactionOptions.maxWait +
  resendTransactionOptions.timeout +
  resendStatementTimeoutMs +
  10_000 +
  1_000;

export const invalidVerificationLink = {
  code: 'VERIFICATION_LINK_INVALID',
  message: 'O link de confirmação é inválido.',
} as const;

export const expiredVerificationLink = {
  code: 'VERIFICATION_LINK_EXPIRED',
  message: 'O link de confirmação expirou.',
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
        await this.storeVerification(tx, user, token);
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
          throw new InternalServerErrorException(undefined, { cause: error });
        }
        throw error;
      });
    try {
      await this.sendVerification(issuance);
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
      if (!candidate) {
        throw new PublicApiException(
          invalidVerificationLink,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.lockVerificationAccount(tx, candidate.userId);

      const verification = await tx.emailVerification.findUnique({
        where: { tokenHash, userId: candidate.userId },
        include: { user: { select: { email: true, emailVerifiedAt: true } } },
      });
      if (!verification || verification.email !== verification.user.email) {
        throw new PublicApiException(
          invalidVerificationLink,
          HttpStatus.BAD_REQUEST,
        );
      }

      const {
        usedAt,
        user: { emailVerifiedAt },
      } = verification;
      if (usedAt !== null && emailVerifiedAt !== null) {
        return { status: 'already-confirmed' };
      }
      if (usedAt !== null || emailVerifiedAt !== null) {
        throw new PublicApiException(
          invalidVerificationLink,
          HttpStatus.BAD_REQUEST,
        );
      }

      const now = new Date(Date.now());
      if (verification.expiresAt <= now) {
        throw new PublicApiException(expiredVerificationLink, HttpStatus.GONE);
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

  async resendVerification(email: string): Promise<ResendVerificationResult> {
    // Respond on the same schedule regardless of the lookup or provider outcome.
    await Promise.all([
      delay(resendResponseWindowMs),
      this.issueAndSendVerification(email).catch(() => {
        this.logger.error('Verification resend could not be completed');
      }),
    ]);
    return { retryAfterSeconds: verificationResendIntervalSeconds };
  }

  private async issueAndSendVerification(email: string): Promise<void> {
    const issuance = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT set_config('statement_timeout', ${String(resendStatementTimeoutMs)}, true)
        `;
        const candidate = await tx.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (!candidate) return;
        await this.lockVerificationAccount(tx, candidate.id);

        const user = await tx.user.findUnique({
          where: { id: candidate.id, email, emailVerifiedAt: null },
          select: { id: true, email: true },
        });
        if (!user) return;

        const token = this.tokens.issue();
        // Every link has the same lifetime, so comparing expirations compares issuance times.
        const minimumExpiry = new Date(
          token.expiresAt.getTime() - verificationResendIntervalSeconds * 1000,
        );
        const recentVerification = await tx.emailVerification.findFirst({
          where: { userId: user.id, expiresAt: { gt: minimumExpiry } },
          select: { id: true },
        });
        if (recentVerification) return;

        await this.storeVerification(tx, user, token);
        return { email: user.email, token: token.token };
      },
      resendTransactionOptions,
    );

    if (issuance) await this.sendVerification(issuance);
  }

  private async lockVerificationAccount(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    // Serialize confirmation and resend before reading the account state.
    await tx.$queryRaw`
      SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE
    `;
  }

  private async storeVerification(
    tx: Prisma.TransactionClient,
    user: { id: string; email: string },
    token: ReturnType<VerificationToken['issue']>,
  ) {
    await tx.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      },
    });
  }

  private async sendVerification(issuance: { email: string; token: string }) {
    const link = new URL(
      '/confirmar-email',
      this.config.getOrThrow<string>('WEB_URL'),
    );
    link.searchParams.set('token', issuance.token);
    await this.email.sendVerificationEmail(issuance.email, link.toString());
  }
}
