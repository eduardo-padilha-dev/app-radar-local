import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataInterceptor } from './data.interceptor.js';
import { ApiExceptionFilter } from './api-exception.filter.js';
import { SESSION_COOKIE } from '../modules/auth/auth-session.guard.js';

export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: new URL(app.get(ConfigService).getOrThrow<string>('CORS_ORIGIN'))
      .origin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorFormat: 'grouped',
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalInterceptors(new DataInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('Radar Local API')
    .setVersion('1.0')
    .addCookieAuth(SESSION_COOKIE)
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
