import { Module } from '@nestjs/common';
import { ResendEmailService } from './resend-email.service.js';

@Module({
  providers: [ResendEmailService],
  exports: [ResendEmailService],
})
export class ResendModule {}
