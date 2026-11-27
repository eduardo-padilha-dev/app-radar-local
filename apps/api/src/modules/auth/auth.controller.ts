import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import {
  PublicRoute,
  readSessionCookie,
  SESSION_COOKIE,
  type AuthenticatedRequest,
} from './auth-session.guard.js';
import { AuthSessionService } from './auth-session.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SessionProfile } from './dto/session-profile.dto.js';
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
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ResendVerificationResult } from './dto/resend-verification-result.dto.js';

const sessionProfileResponse = {
  schema: {
    type: 'object',
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(SessionProfile) },
    },
  },
};

@ApiTags('auth')
@ApiInternalServerErrorResponse({ description: 'Erro interno do servidor.' })
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuthSessionService) private readonly sessions: AuthSessionService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Post('login')
  @PublicRoute()
  @ApiOperation({ summary: 'Inicia uma sessão' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiBody({ type: LoginDto })
  @ApiExtraModels(SessionProfile)
  @ApiOkResponse(sessionProfileResponse)
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Credenciais recusadas.' })
  @ApiConflictResponse({ description: 'Conflito ao criar a sessão.' })
  @ApiForbiddenResponse({ description: 'Origem não autorizada.' })
  async login(
    @Body() input: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionProfile> {
    const origin = this.requireSessionOrigin(req);
    const { profile, token, expiresAt } = await this.sessions.login(input);
    res.cookie(SESSION_COOKIE, token, {
      ...this.sessionCookieOptions(req, origin),
      // Cookie dates use whole seconds. Keep the cookie through the server deadline.
      expires: new Date(Math.ceil(expiresAt.getTime() / 1000) * 1000),
    });
    return profile;
  }

  @Post('logout')
  @PublicRoute()
  @ApiOperation({ summary: 'Encerra a sessão deste dispositivo' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  @ApiNoContentResponse({ description: 'Sessão do dispositivo encerrada.' })
  @ApiForbiddenResponse({ description: 'Origem não autorizada.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const origin = this.requireSessionOrigin(req);
    await this.sessions.logout(readSessionCookie(req));
    res.clearCookie(SESSION_COOKIE, this.sessionCookieOptions(req, origin));
  }

  private requireSessionOrigin(req: Request): URL {
    const origin = new URL(this.config.getOrThrow<string>('CORS_ORIGIN'));
    if (req.headers.origin !== origin.origin) throw new ForbiddenException();
    return origin;
  }

  private sessionCookieOptions(req: Request, origin: URL): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || origin.protocol === 'https:',
      path: '/',
    };
  }

  @Get('session')
  @ApiOperation({ summary: 'Consulta a sessão atual' })
  @ApiCookieAuth()
  @ApiExtraModels(SessionProfile)
  @ApiOkResponse(sessionProfileResponse)
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  session(@Req() req: AuthenticatedRequest): SessionProfile {
    return req.authenticatedUser;
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Consulta uma sessão da própria conta' })
  @ApiCookieAuth()
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'object',
          required: ['id', 'expiresAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'UUID de sessão inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada.' })
  sessionDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.sessions.getOwnedSession(id, req.authenticatedUser.id);
  }

  @Post('register')
  @PublicRoute()
  @ApiOperation({ summary: 'Cria uma conta de desenvolvedor' })
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
  @PublicRoute()
  @ApiOperation({ summary: 'Confirma o e-mail da conta' })
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
  @ApiNotFoundResponse({ description: 'Registro necessário não encontrado.' })
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

  @Post('resend-verification')
  @PublicRoute()
  @ApiOperation({ summary: 'Solicita outro e-mail de confirmação' })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBody({ type: ResendVerificationDto })
  @ApiExtraModels(ResendVerificationResult)
  @ApiAcceptedResponse({
    description: 'Resposta genérica para uma solicitação de reenvio.',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ResendVerificationResult) },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'E-mail ou corpo da solicitação inválido.',
  })
  resendVerification(
    @Body() input: ResendVerificationDto,
  ): Promise<ResendVerificationResult> {
    return this.auth.resendVerification(input.email);
  }
}
