import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class DataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context
          .switchToHttp()
          .getResponse<{ statusCode: number }>();
        return response.statusCode === 204 || data === undefined
          ? undefined
          : { data };
      }),
    );
  }
}
