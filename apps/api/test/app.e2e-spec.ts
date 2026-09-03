import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AppConfigService } from './../src/config/app-config.service';
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
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        success: true,
        data: 'Hello World!',
      });
  });
});
