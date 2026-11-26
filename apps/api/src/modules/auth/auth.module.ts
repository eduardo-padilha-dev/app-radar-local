import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../../database/prisma.module.js';
import { ResendModule } from '../../integrations/resend/resend.module.js';
import { PasswordHasher } from './password-hasher.js';
import { SearchEmailEligibilityService } from './search-email-eligibility.service.js';
import { VerificationToken } from './verification-token.js';

@Module({
  imports: [PrismaModule, ResendModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasher,
    SearchEmailEligibilityService,
    VerificationToken,
  ],
  exports: [SearchEmailEligibilityService],
})
export class AuthModule {}
