import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { OrgStatus } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX } from '../src/constants';
import { OrganizationsRepository } from '../src/modules/organizations/organization.repository';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Auth & Organizations Flow (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let orgsRepository: OrganizationsRepository;

  let orgId: string;
  let accessToken: string;
  let rawRefreshToken: string;
  let newAccessToken: string;
  let newRawRefreshToken: string;

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
    orgsRepository = app.get(OrganizationsRepository);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it(`POST /${API_PREFIX}/organizations/register — registers a new organization with default PENDING status and admin user`, async () => {
    const registerRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Apex Auto Repair',
        adminName: 'John Doe',
        adminEmail: 'admin@apexauto.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.organization).toMatchObject({
      name: 'Apex Auto Repair',
      slug: 'apex-auto-repair',
      status: OrgStatus.PENDING,
    });

    orgId = registerRes.body.data.organization.id;
    expect(orgId).toBeDefined();
  });

  it(`POST /${API_PREFIX}/auth/login — rejects login with 403 ORG_NOT_APPROVED when organization is pending approval`, async () => {
    const pendingLoginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'admin@apexauto.com',
        password: 'Password123!',
      })
      .expect(403);

    expect(pendingLoginRes.body).toMatchObject({
      success: false,
      error: {
        code: 'ORG_NOT_APPROVED',
      },
    });
  });

  it(`POST /${API_PREFIX}/auth/login — succeeds after organization approval, returns accessToken and sets httpOnly refresh cookie`, async () => {
    // Flip org status to ACTIVE via repository (simulating superadmin approval)
    await orgsRepository.updateById(orgId, {
      $set: { status: OrgStatus.ACTIVE },
    });

    const loginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'admin@apexauto.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toHaveProperty('accessToken');
    expect(loginRes.body.data.user).toMatchObject({
      email: 'admin@apexauto.com',
      name: 'John Doe',
      role: 'ORG_ADMIN',
      organizationId: orgId,
    });
    expect('passwordHash' in loginRes.body.data.user).toBe(false);
    expect('refreshTokenHash' in loginRes.body.data.user).toBe(false);

    accessToken = loginRes.body.data.accessToken;

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(refreshCookie).toContain('refreshToken=');
    expect(refreshCookie).toContain('Path=/auth');
    expect(refreshCookie.toLowerCase()).toContain('httponly');

    const refreshTokenMatch = refreshCookie.match(/refreshToken=([^;]+)/);
    expect(refreshTokenMatch).toBeTruthy();
    rawRefreshToken = refreshTokenMatch![1];
  });

  it(`GET /${API_PREFIX}/organizations/me — returns organization profile when authenticated with valid access token`, async () => {
    const meRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data).toMatchObject({
      id: orgId,
      name: 'Apex Auto Repair',
      slug: 'apex-auto-repair',
      status: OrgStatus.ACTIVE,
    });
  });

  it(`GET /${API_PREFIX}/organizations/me — rejects request with 401 UNAUTHORIZED when no token is provided`, async () => {
    const unauthRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me`)
      .expect(401);

    expect(unauthRes.body).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });

  it(`POST /${API_PREFIX}/auth/refresh — rotates refresh token cookie and returns a new access token`, async () => {
    const refreshRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .set('Cookie', [`refreshToken=${rawRefreshToken}`])
      .expect(200);

    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
    newAccessToken = refreshRes.body.data.accessToken;

    const rotatedCookies = refreshRes.headers['set-cookie'];
    expect(rotatedCookies).toBeDefined();
    const newRefreshCookie = Array.isArray(rotatedCookies)
      ? rotatedCookies[0]
      : rotatedCookies;
    const newRefreshTokenMatch = newRefreshCookie.match(/refreshToken=([^;]+)/);
    expect(newRefreshTokenMatch).toBeTruthy();
    newRawRefreshToken = newRefreshTokenMatch![1];
  });

  it(`POST /${API_PREFIX}/auth/logout — logs out user, clears refresh cookie, and invalidates stored refresh token hash`, async () => {
    const logoutRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/logout`)
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    expect(logoutRes.body.success).toBe(true);
  });

  it(`POST /${API_PREFIX}/auth/refresh — rejects refresh with 401 INVALID_REFRESH_TOKEN after user has logged out`, async () => {
    const postLogoutRefreshRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .set('Cookie', [`refreshToken=${newRawRefreshToken}`])
      .expect(401);

    expect(postLogoutRefreshRes.body).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
      },
    });
  });
});
