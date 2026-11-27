import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Role } from '../../../generated/prisma/enums.js';
import { AuthSessionService } from './auth-session.service.js';
import type { SessionProfile } from './dto/session-profile.dto.js';

export const SESSION_COOKIE = 'radar_session';
export const RequireRole = Reflector.createDecorator<Role>();

export function readSessionCookie(req: Request): string | undefined {
  const prefix = SESSION_COOKIE + '=';
  return req.headers.cookie
    ?.split(';')
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(prefix))
    ?.slice(prefix.length);
}

export interface AuthenticatedRequest extends Request {
  authenticatedUser: SessionProfile;
}

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(
    @Inject(AuthSessionService) private readonly sessions: AuthSessionService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    http.getResponse<Response>().setHeader('Cache-Control', 'no-store');

    const token = readSessionCookie(req);
    if (!token) throw new UnauthorizedException();

    const profile = await this.sessions.authenticate(token);
    const requiredRole = this.reflector.getAllAndOverride(RequireRole, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRole && requiredRole !== profile.role) {
      throw new ForbiddenException();
    }

    req.authenticatedUser = profile;
    return true;
  }
}
