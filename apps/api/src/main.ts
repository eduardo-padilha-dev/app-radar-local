import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './common/configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const production = app.get(ConfigService).get('NODE_ENV') === 'production';
  app.useSecurityHeaders({
    contentSecurityPolicy: {
      // Keep Swagger's assets reachable when serving the API over local HTTP.
      directives: { upgradeInsecureRequests: production ? [] : null },
    },
  });
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
