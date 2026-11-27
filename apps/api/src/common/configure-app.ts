import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SESSION_COOKIE } from '../modules/auth/auth-session.guard.js';

export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: new URL(app.get(ConfigService).getOrThrow<string>('CORS_ORIGIN'))
      .origin,
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Radar Local API')
    .setVersion('1.0')
    .addCookieAuth(SESSION_COOKIE)
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));
}
