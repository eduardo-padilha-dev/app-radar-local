import { ApiProperty } from '@nestjs/swagger';

const emailVerificationStatuses = ['confirmed', 'already-confirmed'] as const;

export class EmailVerificationResult {
  @ApiProperty({ enum: [...emailVerificationStatuses] })
  status: (typeof emailVerificationStatuses)[number];
}
