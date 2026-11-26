import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

export class VerifyEmailDto {
  @ApiProperty({ writeOnly: true, pattern: tokenPattern.source })
  @Matches(tokenPattern, { message: 'Informe um token de confirmação válido.' })
  token: string;
}
