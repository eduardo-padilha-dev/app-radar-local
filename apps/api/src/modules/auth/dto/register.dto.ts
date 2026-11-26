import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Length, Matches, ValidateIf } from 'class-validator';
import { normalizeEmail } from './normalize-email.js';

export class RegisterDto {
  @ApiProperty({ example: 'Ana', minLength: 2, maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(2, 100, { message: 'Informe um nome de 2 a 100 caracteres.' })
  name: string;

  @ApiProperty({ example: 'ana@example.com', format: 'email' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({
    writeOnly: true,
    format: 'password',
    minLength: 8,
    maxLength: 128,
  })
  @Length(8, 128, { message: 'Informe uma senha de 8 a 128 caracteres.' })
  password: string;

  @ApiPropertyOptional({ example: '+55 (42) 91234-5678' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const phone = value.trim();
    if (!/^(?:\+55)?[\d\s()-]*$/.test(phone)) return phone;
    const nationalNumber = phone.replace(/^\+55/, '').replace(/[\s()-]/g, '');
    return nationalNumber || phone;
  })
  @ValidateIf((_input, phone: unknown) => phone !== undefined)
  @Matches(/^(?:\d{2}9\d{8})?$/, {
    message:
      'Informe um celular brasileiro com 11 dígitos nacionais, incluindo o DDD, e 9 depois do DDD.',
  })
  phone?: string;
}
