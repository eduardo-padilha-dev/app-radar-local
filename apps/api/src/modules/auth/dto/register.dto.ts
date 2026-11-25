import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ writeOnly: true, format: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '+55 (42) 91234-5678' })
  @ValidateIf((_input, phone: unknown) => phone !== undefined)
  @IsString()
  phone?: string;
}
