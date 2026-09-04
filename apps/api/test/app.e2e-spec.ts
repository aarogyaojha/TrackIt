import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AppConfigService } from './../src/config/app-config.service';
import { API_PREFIX } from './../src/constants';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('AppController (e2e)', () => {
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
    app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it(`/${API_PREFIX} (GET)`, () => {
    return request(app.getHttpServer())
      .get(`/${API_PREFIX}`)
      .expect(200)
      .expect({
        success: true,
        data: 'Hello World!',
      });
  });
});
