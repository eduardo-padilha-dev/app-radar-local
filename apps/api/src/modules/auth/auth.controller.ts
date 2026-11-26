import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiGoneResponse,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiExceptionFilter } from '../../common/api-exception.filter.js';
import {
  AuthService,
  expiredVerificationLink,
  invalidVerificationLink,
} from './auth.service.js';
import { EmailVerificationResult } from './dto/email-verification-result.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
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

  @Post('verify-email')
  @UseFilters(
    new ApiExceptionFilter(({ token }) =>
      token ? invalidVerificationLink : undefined,
    ),
  )
  @ApiBadRequestResponse({
    description: 'Link inválido ou corpo da solicitação inválido.',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'message'],
      properties: {
        statusCode: { type: 'integer', enum: [400] },
        code: {
          type: 'string',
          enum: [invalidVerificationLink.code, 'VALIDATION_ERROR'],
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiGoneResponse({
    description: 'Link expirado.',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'message'],
      properties: {
        statusCode: { type: 'integer', enum: [410] },
        code: { type: 'string', enum: [expiredVerificationLink.code] },
        message: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VerifyEmailDto })
  @ApiExtraModels(EmailVerificationResult)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(EmailVerificationResult) },
      },
    },
  })
  verifyEmail(@Body() input: VerifyEmailDto): Promise<EmailVerificationResult> {
    return this.auth.verifyEmail(input.token);
  }
}
