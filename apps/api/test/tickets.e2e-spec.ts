import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { OrgStatus, Role, TicketStatus } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX, ErrorCode } from '../src/constants';
import { UsersService } from '../src/modules/users/user.service';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Tickets Module (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let orgId: string;
  let orgSlug: string;

  let secondOrgAdminAccessToken: string;
  let secondOrgId: string;

  let ticketId: string;

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

  it(`POST /${API_PREFIX}/organizations/register — registers first organization and user`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Apex Bike Repair',
        adminName: 'Alice Springs',
        adminEmail: 'alice@apexbikes.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    orgId = res.body.data.organization.id;
    orgSlug = res.body.data.organization.slug;
    expect(orgId).toBeDefined();
    expect(orgSlug).toBe('apex-bike-repair');
  });

  it(`POST /${API_PREFIX}/organizations/:id/approve — superadmin approves the first org`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(OrgStatus.ACTIVE);
  });

  it(`POST /${API_PREFIX}/auth/login — org admin of first org logs in`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'alice@apexbikes.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    orgAdminAccessToken = res.body.data.accessToken;
  });

  it(`POST /${API_PREFIX}/organizations/register & approve — registers and approves a second org`, async () => {
    const regRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Zenith Tailors',
        adminName: 'Bob Tailor',
        adminEmail: 'bob@zenithtailors.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    secondOrgId = regRes.body.data.organization.id;

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${secondOrgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'bob@zenithtailors.com',
        password: 'Password123!',
      })
      .expect(200);

    secondOrgAdminAccessToken = loginRes.body.data.accessToken;
  });

  it(`POST /${API_PREFIX}/tickets — creates a ticket and returns publicUrl and qrCodeDataUrl`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        code: 'tick-001',
        customerName: 'John Doe',
        customerPhone: '555-0100',
        itemDescription: 'Mountain Bike Tune-up',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      code: 'TICK-001',
      customerName: 'John Doe',
      customerPhone: '555-0100',
      itemDescription: 'Mountain Bike Tune-up',
      status: TicketStatus.RECEIVED,
      publicUrl: `http://localhost:3000/${orgSlug}/t/TICK-001`,
    });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.statusHistory).toHaveLength(1);
    expect(res.body.data.statusHistory[0].status).toBe(TicketStatus.RECEIVED);
    expect(res.body.data.statusHistory[0].changedBy).toBeDefined();

    ticketId = res.body.data.id;
  });

  it(`POST /${API_PREFIX}/tickets — returns 409 TICKET_CODE_TAKEN on duplicate code within same org`, async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        code: 'TICK-001',
        customerName: 'Jane Duplicate',
        customerPhone: '555-0199',
        itemDescription: 'Road Bike Repair',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.TICKET_CODE_TAKEN);
  });

  it(`PATCH /${API_PREFIX}/tickets/:id/status — full valid lifecycle RECEIVED -> IN_PROGRESS -> READY -> DELIVERED`, async () => {
    // 1. RECEIVED -> IN_PROGRESS
    const inProgressRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    expect(inProgressRes.body.success).toBe(true);
    expect(inProgressRes.body.data.status).toBe(TicketStatus.IN_PROGRESS);
    expect(inProgressRes.body.data.statusHistory).toHaveLength(2);
    expect(inProgressRes.body.data.statusHistory[1].status).toBe(
      TicketStatus.IN_PROGRESS,
    );

    // 2. IN_PROGRESS -> READY
    const readyRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: TicketStatus.READY })
      .expect(200);

    expect(readyRes.body.success).toBe(true);
    expect(readyRes.body.data.status).toBe(TicketStatus.READY);
    expect(readyRes.body.data.statusHistory).toHaveLength(3);
    expect(readyRes.body.data.statusHistory[2].status).toBe(TicketStatus.READY);

    // 3. READY -> DELIVERED
    const deliveredRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: TicketStatus.DELIVERED })
      .expect(200);

    expect(deliveredRes.body.success).toBe(true);
    expect(deliveredRes.body.data.status).toBe(TicketStatus.DELIVERED);
    expect(deliveredRes.body.data.statusHistory).toHaveLength(4);
    expect(deliveredRes.body.data.statusHistory[3].status).toBe(
      TicketStatus.DELIVERED,
    );
  });

  it(`PATCH /${API_PREFIX}/tickets/:id/status — attempt DELIVERED -> IN_PROGRESS returns 409 INVALID_STATUS_TRANSITION`, async () => {
    const res = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.INVALID_STATUS_TRANSITION);
  });

  it(`GET /${API_PREFIX}/tickets/:id — querying ticket from a different org returns 404 NOT_FOUND (not 403)`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${secondOrgAdminAccessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it(`GET /${API_PREFIX}/tickets/:id — org admin can retrieve own ticket with valid QR and public URL`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: ticketId,
      code: 'TICK-001',
      customerName: 'John Doe',
      customerPhone: '555-0100',
      itemDescription: 'Mountain Bike Tune-up',
      status: TicketStatus.DELIVERED,
      publicUrl: `http://localhost:3000/${orgSlug}/t/TICK-001`,
    });
    expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.statusHistory).toHaveLength(4);
    expect(res.body.data.statusHistory[0].changedBy).toBeDefined();
  });

  it(`GET /${API_PREFIX}/tickets — lists tickets with pagination meta and valid QR data URLs across all items`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const codes = res.body.data.map((item: { code: string }) => item.code);
    expect(codes).toContain('TICK-001');

    expect(res.body.meta).toMatchObject({
      total: expect.any(Number),
      page: 1,
      limit: 20,
      totalPages: expect.any(Number),
    });

    // Verify EVERY item in the array has a valid QR code data-URL from concurrent Promise.all mapping
    res.body.data.forEach((item: { qrCodeDataUrl: string }) => {
      expect(item.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  it(`GET /${API_PREFIX}/tickets?status=DELIVERED — filters tickets by status`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/tickets?status=${TicketStatus.DELIVERED}`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const codes = res.body.data.map((item: { code: string }) => item.code);
    expect(codes).toContain('TICK-001');

    res.body.data.forEach((item: { status: TicketStatus }) => {
      expect(item.status).toBe(TicketStatus.DELIVERED);
    });
  });

  it(`PATCH /${API_PREFIX}/plans/FREE & create tickets — enforces maxActiveTickets limit with 409 PLAN_LIMIT_EXCEEDED`, async () => {
    // Set FREE plan maxActiveTickets to 2
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/plans/FREE`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ maxActiveTickets: 2 })
      .expect(200);

    // Register a fresh org for plan limits testing
    const limitOrgReg = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Limit Test Org',
        adminName: 'Limit Admin',
        adminEmail: 'admin@limittest.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    const limitOrgId = limitOrgReg.body.data.organization.id;

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${limitOrgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const limitLoginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'admin@limittest.com',
        password: 'Password123!',
      })
      .expect(200);

    const limitAdminToken = limitLoginRes.body.data.accessToken;

    // Create 1st ticket -> 201
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${limitAdminToken}`)
      .send({
        code: 'LIM-001',
        customerName: 'User One',
        customerPhone: '555-1111',
        itemDescription: 'Item One',
      })
      .expect(201);

    // Create 2nd ticket -> 201
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${limitAdminToken}`)
      .send({
        code: 'LIM-002',
        customerName: 'User Two',
        customerPhone: '555-2222',
        itemDescription: 'Item Two',
      })
      .expect(201);

    // Create 3rd ticket -> 409 PLAN_LIMIT_EXCEEDED
    const thirdRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${limitAdminToken}`)
      .send({
        code: 'LIM-003',
        customerName: 'User Three',
        customerPhone: '555-3333',
        itemDescription: 'Item Three',
      })
      .expect(409);

    expect(thirdRes.body.success).toBe(false);
    expect(thirdRes.body.error.code).toBe(ErrorCode.PLAN_LIMIT_EXCEEDED);
  });

  it(`GET /${API_PREFIX}/public/:orgSlug/tickets/:code — public lookup returns sanitized response with no customerPhone, changedBy, or id`, async () => {
    // Create fresh ticket in Org A
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        code: 'PUB-001',
        customerName: 'Public Customer',
        customerPhone: '555-9999',
        itemDescription: 'Public Item',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/public/${orgSlug}/tickets/PUB-001`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      organizationName: 'Apex Bike Repair',
      code: 'PUB-001',
      customerName: 'Public Customer',
      itemDescription: 'Public Item',
      status: TicketStatus.RECEIVED,
      statusHistory: [
        {
          status: TicketStatus.RECEIVED,
          changedAt: expect.any(String),
        },
      ],
      createdAt: expect.any(String),
    });

    // Explicit security exclusions
    expect('customerPhone' in res.body.data).toBe(false);
    expect('id' in res.body.data).toBe(false);
    expect('_id' in res.body.data).toBe(false);
    expect('qrCodeDataUrl' in res.body.data).toBe(false);
    expect('changedBy' in res.body.data.statusHistory[0]).toBe(false);
  });

  it(`GET /${API_PREFIX}/public/:orgSlug/tickets/:code — returns 404 NOT_FOUND for wrong ticket code`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/public/${orgSlug}/tickets/NONEXISTENT-CODE`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it(`GET /${API_PREFIX}/public/:orgSlug/tickets/:code — returns 404 NOT_FOUND when organization is SUSPENDED`, async () => {
    // Suspend Org A
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/suspend`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/public/${orgSlug}/tickets/PUB-001`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});
