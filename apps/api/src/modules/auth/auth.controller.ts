import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
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
  @ApiConflictResponse({
    description: 'E-mail já cadastrado.',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'message'],
      properties: {
        statusCode: { type: 'integer', enum: [409] },
        code: { type: 'string', enum: ['EMAIL_ALREADY_REGISTERED'] },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadGatewayResponse({
    description: 'Conta criada com e-mail pendente e envio não confirmado.',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'message', 'details'],
      properties: {
        statusCode: { type: 'integer', enum: [502] },
        code: { type: 'string', enum: ['VERIFICATION_EMAIL_UNCONFIRMED'] },
        message: { type: 'string' },
        details: {
          type: 'object',
          required: ['accountCreated', 'emailVerificationPending'],
          properties: {
            accountCreated: { type: 'boolean', enum: [true] },
            emailVerificationPending: { type: 'boolean', enum: [true] },
          },
        },
      },
    },
  })
  register(@Body() input: RegisterDto): Promise<RegistrationResult> {
    return this.auth.register(input);
  }
}
