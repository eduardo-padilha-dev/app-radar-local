import {
  ArgumentsHost,
  Catch,
  HttpException,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;
    let details: Record<string, string[]> | undefined;
    if (statusCode === 400 && exception instanceof HttpException) {
      const body = exception.getResponse();
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
    response
      .status(statusCode)
      .json({
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
