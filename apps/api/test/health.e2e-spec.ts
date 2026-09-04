import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX } from '../src/constants';
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
        corsOrigin: 'http://localhost:3000',
        jwtAccessSecret: 'test-jwt-access-secret',
        jwtRefreshSecret: 'test-jwt-refresh-secret',
        jwtAccessExpiresIn: '15m',
        jwtRefreshExpiresIn: '7d',
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
    app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it('GET /health returns successful response envelope with database health status (unprefixed bare route)', async () => {
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

  it(`GET /${API_PREFIX}/health returns 404 confirming /health is excluded from API prefix`, async () => {
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/health`)
      .expect(404);
  });
});
