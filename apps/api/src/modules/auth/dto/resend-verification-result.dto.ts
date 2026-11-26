import { ApiProperty } from '@nestjs/swagger';

export const verificationResendIntervalSeconds = 60;

export class ResendVerificationResult {
  @ApiProperty({ enum: [verificationResendIntervalSeconds] })
  retryAfterSeconds: number;
}
