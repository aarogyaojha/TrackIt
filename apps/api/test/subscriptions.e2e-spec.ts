import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { OrgStatus, PlanTier, Role } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX, ErrorCode } from '../src/constants';
import { DEFAULT_PLAN_LIMITS } from '../src/modules/plans/plan.constants';
import { UsersService } from '../src/modules/users/user.service';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Plans & Subscriptions (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let orgId: string;

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

    // Seed superadmin
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

  it(`POST /${API_PREFIX}/auth/login — superadmin can log in`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'superadmin@trackit.internal',
        password: 'SuperadminPassword123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    superadminAccessToken = res.body.data.accessToken;
  });

  it(`POST /${API_PREFIX}/organizations/register — registers an org with initial PENDING status and creates default subscription`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Apex Motor Works',
        adminName: 'Bob Builder',
        adminEmail: 'bob@apexmotors.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    orgId = res.body.data.organization.id;
    expect(orgId).toBeDefined();
  });

  it(`POST /${API_PREFIX}/organizations/:id/approve — superadmin approves the organization`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(OrgStatus.ACTIVE);
  });


  it(`POST /${API_PREFIX}/auth/login — org admin can log in once active`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'bob@apexmotors.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    orgAdminAccessToken = res.body.data.accessToken;
  });

  it(`GET /${API_PREFIX}/organizations/:id/subscription — superadmin can view org subscription with default FREE limits and staff count`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/${orgId}/subscription`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      planTier: PlanTier.FREE,
      limits: DEFAULT_PLAN_LIMITS[PlanTier.FREE],
      usage: {
        staffUsers: 1,
        ticketsThisMonth: 0,
        activeTickets: 0,
      },
    });
    expect('_id' in res.body.data).toBe(false);
    expect('__v' in res.body.data).toBe(false);
  });

  it(`GET /${API_PREFIX}/organizations/me/subscription — org admin can view own org subscription`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      planTier: PlanTier.FREE,
      limits: DEFAULT_PLAN_LIMITS[PlanTier.FREE],
      usage: {
        staffUsers: 1,
        ticketsThisMonth: 0,
        activeTickets: 0,
      },
    });
  });

  it(`GET /${API_PREFIX}/organizations/:id/subscription — non-superadmin hitting another org's subscription receives 403 FORBIDDEN`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/${orgId}/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it(`PATCH /${API_PREFIX}/organizations/:id/subscription — superadmin can upgrade org subscription tier to PRO`, async () => {
    const res = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/organizations/${orgId}/subscription`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ planTier: PlanTier.PRO })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      planTier: PlanTier.PRO,
      limits: DEFAULT_PLAN_LIMITS[PlanTier.PRO],
      usage: {
        staffUsers: 1,
        ticketsThisMonth: 0,
        activeTickets: 0,
      },
    });
  });

  it(`GET /${API_PREFIX}/plans — superadmin can list all 3 tiers with default limits`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/plans`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(3);

    const tiers = res.body.data.map((p: { tier: PlanTier }) => p.tier);
    expect(tiers).toEqual(
      expect.arrayContaining([PlanTier.FREE, PlanTier.BASIC, PlanTier.PRO]),
    );

    const freePlan = res.body.data.find(
      (p: { tier: PlanTier }) => p.tier === PlanTier.FREE,
    );
    expect(freePlan.limits).toEqual(DEFAULT_PLAN_LIMITS[PlanTier.FREE]);
  });

  it(`PATCH /${API_PREFIX}/plans/FREE — superadmin can partially update FREE tier limits`, async () => {
    const res = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/plans/FREE`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ maxStaffUsers: 2 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe(PlanTier.FREE);
    expect(res.body.data.limits).toEqual({
      maxActiveTickets: DEFAULT_PLAN_LIMITS[PlanTier.FREE].maxActiveTickets,
      maxStaffUsers: 2,
      maxTicketsPerMonth:
        DEFAULT_PLAN_LIMITS[PlanTier.FREE].maxTicketsPerMonth,
    });
    expect('_id' in res.body.data).toBe(false);
    expect('__v' in res.body.data).toBe(false);
  });

  it(`GET or PATCH /${API_PREFIX}/plans/not-a-real-tier — returns 400 VALIDATION_ERROR via ParseEnumPipe`, async () => {
    const res = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/plans/not-a-real-tier`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ maxStaffUsers: 5 })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});
