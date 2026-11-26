import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Length } from 'class-validator';
import { normalizeEmail } from './normalize-email.js';

export class LoginDto {
  @ApiProperty({ format: 'email' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 1,
    maxLength: 128,
  })
  @Length(1, 128, { message: 'Informe sua senha.' })
  password: string;
}
