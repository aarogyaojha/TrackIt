import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_DEFAULTS } from '../constants/swagger.constants';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_DEFAULTS.TITLE)
    .setDescription(SWAGGER_DEFAULTS.DESCRIPTION)
    .setVersion(SWAGGER_DEFAULTS.VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      SWAGGER_DEFAULTS.AUTH_BEARER_NAME,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_DEFAULTS.DOCS_PATH, app, document);
}
