import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiBadRequestResponse({
    description: 'Erro de validação do cadastro.',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'message'],
      properties: {
        statusCode: { type: 'integer', enum: [400] },
        code: { type: 'string', enum: ['VALIDATION_ERROR'] },
        message: { type: 'string' },
        details: {
          type: 'object',
          description: 'Mensagens de validação por campo, quando disponíveis.',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  })
  register(@Body() input: RegisterDto): Promise<RegistrationResult> {
    return this.auth.register(input);
  }
}
