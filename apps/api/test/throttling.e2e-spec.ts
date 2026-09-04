import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX, ErrorCode } from '../src/constants';
import { AUTH_THROTTLE_LIMIT } from '../src/common/throttle/throttle.constants';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Throttling & Rate Limiting (e2e)', () => {
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
        jwtAccessSecret: 'test-jwt-access-secret-1234567890',
        jwtRefreshSecret: 'test-jwt-refresh-secret-1234567890',
        jwtAccessExpiresIn: '15m',
        jwtRefreshExpiresIn: '7d',
        superadminEmail: 'superadmin@trackit.internal',
        superadminPassword: 'SuperadminPassword123!',
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
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

  it(`POST /${API_PREFIX}/auth/login — rate limits after exceeding AUTH_THROTTLE_LIMIT (${AUTH_THROTTLE_LIMIT}) requests`, async () => {
    // Send requests up to AUTH_THROTTLE_LIMIT
    for (let i = 0; i < AUTH_THROTTLE_LIMIT; i++) {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/login`)
        .send({
          email: 'invalid@example.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    }

    // Request exceeding AUTH_THROTTLE_LIMIT must return 429 RATE_LIMITED
    const blockedRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'invalid@example.com',
        password: 'WrongPassword123!',
      })
      .expect(429);

    expect(blockedRes.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
      },
    });

    // Note: @nestjs/throttler sets suffix on named throttlers ('Retry-After-auth')
    const retryAfterHeader =
      blockedRes.headers['retry-after'] ??
      blockedRes.headers['retry-after-auth'];
    expect(retryAfterHeader).toBeDefined();
    expect(Number(retryAfterHeader)).toBeGreaterThan(0);
  });

  it(`GET /health — can be hit more than AUTH_THROTTLE_LIMIT times without being rate limited`, async () => {
    const totalRequests = AUTH_THROTTLE_LIMIT + 5;

    for (let i = 0; i < totalRequests; i++) {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    }
  });
});
