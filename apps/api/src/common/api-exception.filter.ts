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
      });
  }
}
