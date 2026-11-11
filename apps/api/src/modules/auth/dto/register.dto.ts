import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
