import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAccessController } from './admin-access.controller.js';
import { AuthSessionGuard } from './auth-session.guard.js';
import { AuthSessionService } from './auth-session.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../../database/prisma.module.js';
import { ResendModule } from '../../integrations/resend/resend.module.js';
import { PasswordHasher } from './password-hasher.js';
import { SearchEmailEligibilityService } from './search-email-eligibility.service.js';
import { VerificationToken } from './verification-token.js';

@Module({
  imports: [
    PrismaModule,
    ResendModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, AdminAccessController],
  providers: [
    AuthService,
    AuthSessionService,
    AuthSessionGuard,
    PasswordHasher,
    SearchEmailEligibilityService,
    VerificationToken,
  ],
  exports: [
    AuthSessionGuard,
    AuthSessionService,
    SearchEmailEligibilityService,
  ],
})
export class AuthModule {}
