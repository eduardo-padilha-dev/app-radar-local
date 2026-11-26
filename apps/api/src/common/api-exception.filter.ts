import {
  ArgumentsHost,
  Catch,
  HttpException,
  type ExceptionFilter,
  type HttpExceptionOptions,
} from '@nestjs/common';
import type { Response } from 'express';

type PublicApiError = {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
};

export class PublicApiException extends HttpException {
  constructor(
    readonly publicError: PublicApiError,
    status: number,
    options?: HttpExceptionOptions,
  ) {
    super(publicError, status, options);
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;
    if (exception instanceof PublicApiException) {
      const { code, message, details } = exception.publicError;
      response.status(statusCode).json({
        statusCode,
        code,
        message,
        details,
      });
      return;
    }
    const body =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    if (
      statusCode === 409 &&
      typeof body === 'object' &&
      'code' in body &&
      body.code === 'EMAIL_ALREADY_REGISTERED'
    ) {
      response.status(statusCode).json({
        statusCode,
        code: body.code,
        message:
          'Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.',
      });
      return;
    }
    let details: Record<string, string[]> | undefined;
    if (statusCode === 400) {
      if (
        typeof body === 'object' &&
        'message' in body &&
        typeof body.message === 'object' &&
        body.message !== null &&
        !Array.isArray(body.message)
      ) {
        const fields = Object.entries(body.message).filter(
          ([field, messages]) =>
            Array.isArray(messages) &&
            messages.length > 0 &&
            messages.every((message: unknown) => typeof message === 'string') &&
            messages[0] !== `property ${field} should not exist`,
        );
        if (fields.length) details = Object.fromEntries(fields);
      }
    }
    response.status(statusCode).json({
      statusCode,
      code:
        statusCode === 400
          ? 'VALIDATION_ERROR'
          : statusCode >= 500
            ? 'INTERNAL_ERROR'
            : 'HTTP_ERROR',
      message:
        statusCode >= 500
          ? 'Erro interno do servidor.'
          : statusCode === 400
            ? 'Verifique os campos informados.'
            : 'Não foi possível concluir a solicitação.',
      ...(details && { details }),
    });
  }
}
