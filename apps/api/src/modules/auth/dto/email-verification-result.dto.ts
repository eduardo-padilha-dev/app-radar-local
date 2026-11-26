import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationResult {
  @ApiProperty({ enum: ['confirmed'] })
  status: 'confirmed';
}
