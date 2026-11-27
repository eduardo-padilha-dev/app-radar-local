import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums.js';
import { RequireRole } from './auth-session.guard.js';

@ApiTags('admin')
@ApiInternalServerErrorResponse({ description: 'Erro interno do servidor.' })
@Controller('admin')
export class AdminAccessController {
  @Get('access')
  @RequireRole(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verifica o acesso administrativo' })
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'Acesso administrativo permitido.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Acesso exclusivo de administradores.' })
  access(): void {}
}
