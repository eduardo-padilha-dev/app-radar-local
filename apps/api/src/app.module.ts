import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { DataInterceptor } from './common/data.interceptor.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthSessionGuard } from './modules/auth/auth-session.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ResendModule } from './integrations/resend/resend.module.js';
import { validateEnvironment } from './config/environment.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AuthModule,
    ResendModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useExisting: AuthSessionGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorFormat: 'grouped',
        transformOptions: { enableImplicitConversion: false },
      }),
    },
    { provide: APP_INTERCEPTOR, useClass: DataInterceptor },
    { provide: APP_FILTER, useFactory: () => new ApiExceptionFilter() },
  ],
})
export class AppModule {}
