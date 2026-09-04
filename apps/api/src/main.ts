import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupSwagger } from './config/swagger.config';
import { API_PREFIX, SWAGGER_DEFAULTS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfigService = app.get(AppConfigService);

  app.use(cookieParser());

  app.enableCors({
    origin: appConfigService.corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });

  setupSwagger(app);

  const port = appConfigService.port;

  await app.listen(port);

  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`, 'Bootstrap');
  Logger.log(
    `Swagger documentation available at: ${url}/${SWAGGER_DEFAULTS.DOCS_PATH}`,
    'Bootstrap',
  );
}

bootstrap();
