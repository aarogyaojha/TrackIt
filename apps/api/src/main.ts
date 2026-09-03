import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupSwagger } from './config/swagger.config';
import { SWAGGER_DEFAULTS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  const appConfigService = app.get(AppConfigService);
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
