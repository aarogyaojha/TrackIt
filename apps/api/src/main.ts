import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupSwagger } from './config/swagger.config';
import { API_PREFIX, SWAGGER_DEFAULTS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const appConfigService = app.get(AppConfigService);

  app.disable('x-powered-by');

  app.use(
    helmet({
      // Swagger UI in non-production relies on inline scripts/styles
      contentSecurityPolicy: appConfigService.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useBodyParser('json', { limit: '100kb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '100kb' });
  app.use(cookieParser());

  const allowedOrigins = appConfigService.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');

  app.enableCors({
    origin: allowedOrigins.length <= 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });

  if (!appConfigService.isProduction) {
    setupSwagger(app);
  }

  const port = appConfigService.port;

  await app.listen(port);

  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`, 'Bootstrap');
  if (!appConfigService.isProduction) {
    Logger.log(
      `Swagger documentation available at: ${url}/${SWAGGER_DEFAULTS.DOCS_PATH}`,
      'Bootstrap',
    );
  }
}

bootstrap();
