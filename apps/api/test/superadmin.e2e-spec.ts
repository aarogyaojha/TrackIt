import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { OrgStatus, Role } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX } from '../src/constants';
import { UsersService } from '../src/modules/users/user.service';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Superadmin & Platform Management (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let orgId: string;
  let secondOrgId: string;

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
    usersService = app.get(UsersService);

    // Seed superadmin user directly via UsersService
    await usersService.createUser({
      email: 'superadmin@trackit.internal',
      name: 'Super Admin',
      password: 'SuperadminPassword123!',
      role: Role.SUPERADMIN,
      organizationId: null,
    });
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  it(`POST /${API_PREFIX}/auth/login — superadmin can log in and receive an access token`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'superadmin@trackit.internal',
        password: 'SuperadminPassword123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toMatchObject({
      email: 'superadmin@trackit.internal',
      role: Role.SUPERADMIN,
    });

    superadminAccessToken = res.body.data.accessToken;
  });

  it(`POST /${API_PREFIX}/organizations/register — registers an organization with initial PENDING status`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'QuickFix Garage',
        adminName: 'Alice Smith',
        adminEmail: 'alice@quickfix.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.organization).toMatchObject({
      name: 'QuickFix Garage',
      slug: 'quickfix-garage',
      status: OrgStatus.PENDING,
    });

    orgId = res.body.data.organization.id;
    expect(orgId).toBeDefined();
  });

  it(`GET /${API_PREFIX}/organizations — non-superadmin (anonymous/unauthenticated) receives 401 UNAUTHORIZED`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations`)
      .expect(401);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });

  it(`GET /${API_PREFIX}/organizations?status=PENDING — superadmin can list pending organizations with pagination metadata`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations?status=PENDING`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toMatchObject({
      id: orgId,
      name: 'QuickFix Garage',
      status: OrgStatus.PENDING,
    });
    expect(res.body.data[0]).toHaveProperty('id');
    expect('_id' in res.body.data[0]).toBe(false);
    expect('__v' in res.body.data[0]).toBe(false);
    expect(res.body.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it(`GET /${API_PREFIX}/organizations/:id — superadmin can fetch organization details by ID`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/${orgId}`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: orgId,
      name: 'QuickFix Garage',
      slug: 'quickfix-garage',
      status: OrgStatus.PENDING,
    });
    expect(res.body.data).toHaveProperty('id');
    expect('_id' in res.body.data).toBe(false);
    expect('__v' in res.body.data).toBe(false);
  });

  it(`GET /${API_PREFIX}/organizations/:id — rejects malformed ObjectId with 400 VALIDATION_ERROR`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/not-a-valid-id`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/approve — superadmin approves pending organization to ACTIVE status`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: orgId,
      status: OrgStatus.ACTIVE,
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/approve — rejects malformed ObjectId with 400 VALIDATION_ERROR`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/not-a-valid-id/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/reject — superadmin rejects a pending organization to REJECTED status`, async () => {
    // Register a separate org to reject
    const regRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'RejectMe Auto',
        adminName: 'Reject Admin',
        adminEmail: 'reject@rejectme.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    const rejectOrgId = regRes.body.data.organization.id;

    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${rejectOrgId}/reject`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: rejectOrgId,
      status: OrgStatus.REJECTED,
    });

    // Re-rejecting should fail with 409 INVALID_STATUS_TRANSITION
    const reRejectRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${rejectOrgId}/reject`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(409);

    expect(reRejectRes.body).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
      },
    });

    // Admin cannot log in to a REJECTED organization
    const loginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'reject@rejectme.com',
        password: 'Password123!',
      })
      .expect(403);

    expect(loginRes.body).toMatchObject({
      success: false,
      error: {
        code: 'ORG_NOT_APPROVED',
      },
    });
  });


  it(`POST /${API_PREFIX}/auth/login — org admin can now log in after superadmin approval`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'alice@quickfix.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      email: 'alice@quickfix.com',
      role: Role.ORG_ADMIN,
      organizationId: orgId,
    });

    orgAdminAccessToken = res.body.data.accessToken;
  });

  it(`GET /${API_PREFIX}/organizations — org admin receives 403 FORBIDDEN on superadmin-only endpoints`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/approve — rejects re-approving an already ACTIVE organization with 409 INVALID_STATUS_TRANSITION`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(409);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
      },
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/suspend — superadmin suspends the active organization`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/suspend`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: orgId,
      status: OrgStatus.SUSPENDED,
    });
  });

  it(`POST /${API_PREFIX}/auth/login — org admin login is rejected with 403 ORG_NOT_APPROVED while organization is suspended`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'alice@quickfix.com',
        password: 'Password123!',
      })
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'ORG_NOT_APPROVED',
      },
    });
  });

  it(`POST /${API_PREFIX}/organizations/:id/reactivate — superadmin reactivates suspended organization to ACTIVE status`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/reactivate`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: orgId,
      status: OrgStatus.ACTIVE,
    });
  });

  it(`POST /${API_PREFIX}/auth/login — org admin login succeeds again after reactivation`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'alice@quickfix.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it(`GET /${API_PREFIX}/platform-settings — superadmin reads default platform settings (requireOrgApproval: true)`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/platform-settings`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      requireOrgApproval: true,
    });
  });

  it(`PATCH /${API_PREFIX}/platform-settings — superadmin updates requireOrgApproval to false`, async () => {
    const res = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/platform-settings`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ requireOrgApproval: false })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      requireOrgApproval: false,
    });
  });

  it(`POST /${API_PREFIX}/organizations/register — new organization becomes ACTIVE immediately when requireOrgApproval is false`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Direct Active Tailors',
        adminName: 'Bob Vance',
        adminEmail: 'bob@directtailors.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.organization).toMatchObject({
      name: 'Direct Active Tailors',
      slug: 'direct-active-tailors',
      status: OrgStatus.ACTIVE,
    });

    secondOrgId = res.body.data.organization.id;
    expect(secondOrgId).toBeDefined();
  });
});
