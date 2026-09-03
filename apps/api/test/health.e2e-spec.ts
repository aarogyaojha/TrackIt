import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Health & Error Envelope (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;

  beforeAll(async () => {
    mongoUri = await startMongoMemoryServer();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppConfigService)
      .useValue({
        nodeEnv: 'test',
        port: 4000,
        mongodbUri: mongoUri,
        isProduction: false,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it('GET /health returns successful response envelope with database health status', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
      },
    });
  });

  it('GET /nonexistent returns standardized error response envelope with 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/nonexistent-route')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
      },
    });
    expect(response.body.error).toHaveProperty('message');
  });
});
