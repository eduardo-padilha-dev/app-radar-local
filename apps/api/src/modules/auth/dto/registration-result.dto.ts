import { ApiProperty } from '@nestjs/swagger';

export class RegistrationResult {
  @ApiProperty({ enum: [true] })
  accountCreated: true;

  @ApiProperty({ enum: ['accepted'] })
  verificationEmailStatus: 'accepted';
}
