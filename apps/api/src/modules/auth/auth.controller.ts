import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { RegistrationResult } from './dto/registration-result.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          required: ['accountCreated', 'verificationEmailStatus'],
          properties: {
            accountCreated: { type: 'boolean', enum: [true] },
            verificationEmailStatus: { type: 'string', enum: ['accepted'] },
          },
        },
      },
      required: ['data'],
    },
  })
  register(@Body() input: RegisterDto): Promise<RegistrationResult> {
    return this.auth.register(input);
  }
}
