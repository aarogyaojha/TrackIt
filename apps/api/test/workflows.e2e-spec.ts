import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { Types } from 'mongoose';
import { PlanTier, Role, StatusCategory } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX, ErrorCode } from '../src/constants';
import { EmailService } from '../src/modules/email/email.service';
import { UsersRepository } from '../src/modules/users/user.repository';
import { UsersService } from '../src/modules/users/user.service';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Workflows Module (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let staffAccessToken: string;
  let orgId: string;
  let orgSlug: string;

  let orgBAdminAccessToken: string;
  let orgBId: string;

  let customWorkflowId: string;

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

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
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
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
    usersRepository = app.get(UsersRepository);

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

  it('Setup: Log in superadmin and register Org A and Org B', async () => {
    // 1. Superadmin login
    const saLoginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'superadmin@trackit.internal',
        password: 'SuperadminPassword123!',
      })
      .expect(200);
    superadminAccessToken = saLoginRes.body.data.accessToken;

    // 2. Register Org A
    const regResA = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Alpha Repairs',
        adminName: 'Alice Admin',
        adminEmail: 'alice@alpha.internal',
        adminPassword: 'Password123!',
      })
      .expect(201);
    orgId = regResA.body.data.organization.id;
    orgSlug = regResA.body.data.organization.slug;

    const userA = await usersRepository.findByEmailWithPassword('alice@alpha.internal');
    await usersRepository.updateById(userA!._id.toString(), {
      $set: { emailVerified: true },
    });

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const loginResA = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'alice@alpha.internal',
        password: 'Password123!',
      })
      .expect(200);
    orgAdminAccessToken = loginResA.body.data.accessToken;

    // 3. Register Org B
    const regResB = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Beta Repairs',
        adminName: 'Bob Admin',
        adminEmail: 'bob@beta.internal',
        adminPassword: 'Password123!',
      })
      .expect(201);
    orgBId = regResB.body.data.organization.id;

    const userB = await usersRepository.findByEmailWithPassword('bob@beta.internal');
    await usersRepository.updateById(userB!._id.toString(), {
      $set: { emailVerified: true },
    });

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgBId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const loginResB = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'bob@beta.internal',
        password: 'Password123!',
      })
      .expect(200);
    orgBAdminAccessToken = loginResB.body.data.accessToken;

    // 4. Create Staff in Org A
    const staffUser = await usersService.createUser({
      email: 'staff@alpha.internal',
      name: 'Sam Staff',
      password: 'Password123!',
      role: Role.ORG_STAFF,
      organizationId: new Types.ObjectId(orgId),
    });
    await usersRepository.updateById(staffUser._id.toString(), {
      $set: { emailVerified: true },
    });

    const staffLoginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'staff@alpha.internal',
        password: 'Password123!',
      })
      .expect(200);
    staffAccessToken = staffLoginRes.body.data.accessToken;
  });

  it('Superadmin gets 403 on tenant routes via TenantGuard', async () => {
    // GET workflows as Superadmin
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(403);

    // POST workflow as Superadmin
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({
        name: 'Superadmin Workflow',
        statuses: [
          { key: 'init', name: 'Init', category: StatusCategory.INITIAL, order: 0 },
          { key: 'done', name: 'Done', category: StatusCategory.COMPLETED, order: 1 },
        ],
      })
      .expect(403);
  });

  it('Validation checks: no INITIAL, no COMPLETED, duplicate keys, more than 12 statuses all give 400', async () => {
    // Missing INITIAL status
    const noInitialRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'No Initial Workflow',
        statuses: [
          { key: 'prog', name: 'Progress', category: StatusCategory.IN_PROGRESS, order: 0 },
          { key: 'done', name: 'Done', category: StatusCategory.COMPLETED, order: 1 },
        ],
      })
      .expect(400);
    expect(noInitialRes.body.error.code).toBe(ErrorCode.INVALID_WORKFLOW_STATUSES);

    // Missing COMPLETED status
    const noCompletedRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'No Completed Workflow',
        statuses: [
          { key: 'init', name: 'Init', category: StatusCategory.INITIAL, order: 0 },
          { key: 'prog', name: 'Progress', category: StatusCategory.IN_PROGRESS, order: 1 },
        ],
      })
      .expect(400);
    expect(noCompletedRes.body.error.code).toBe(ErrorCode.INVALID_WORKFLOW_STATUSES);

    // Duplicate keys (case-insensitive)
    const dupRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'Duplicate Keys Workflow',
        statuses: [
          { key: 'step1', name: 'Step 1', category: StatusCategory.INITIAL, order: 0 },
          { key: 'STEP1', name: 'Step 1 Dup', category: StatusCategory.COMPLETED, order: 1 },
        ],
      })
      .expect(400);
    expect(dupRes.body.error.code).toBe(ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS);

    // More than 12 statuses
    const thirteenStatuses = Array.from({ length: 13 }, (_, i) => ({
      key: `step_${i}`,
      name: `Step ${i}`,
      category:
        i === 0
          ? StatusCategory.INITIAL
          : i === 12
            ? StatusCategory.COMPLETED
            : StatusCategory.IN_PROGRESS,
      order: i,
    }));

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'Too Many Statuses',
        statuses: thirteenStatuses,
      })
      .expect(400);
  });

  it('Plan limits: maxWorkflows limit enforces 409 PLAN_LIMIT_EXCEEDED on FREE tier, works after upgrade', async () => {
    // Org A is on FREE tier (maxWorkflows = 1). The default workflow exists.
    // Listing workflows auto-seeds the default workflow.
    const listRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);
    expect(listRes.body.data.length).toBe(1);

    // Creating second workflow on FREE tier fails with 409 PLAN_LIMIT_EXCEEDED
    const failRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'Custom Repair Flow',
        statuses: [
          { key: 'received', name: 'Received', customerLabel: 'We got it', category: StatusCategory.INITIAL, order: 0 },
          { key: 'fixing', name: 'Fixing', customerLabel: 'Working on it', category: StatusCategory.IN_PROGRESS, order: 1 },
          { key: 'ready', name: 'Ready', customerLabel: 'Come pick it up', category: StatusCategory.READY, order: 2 },
          { key: 'closed', name: 'Closed', customerLabel: 'Returned to customer', category: StatusCategory.COMPLETED, order: 3 },
          { key: 'cancelled', name: 'Cancelled', customerLabel: 'Cancelled', category: StatusCategory.CANCELLED, order: 4 },
        ],
      })
      .expect(409);
    expect(failRes.body.error.code).toBe(ErrorCode.PLAN_LIMIT_EXCEEDED);

    // Superadmin upgrades Org A to BASIC tier (maxWorkflows = 3)
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/organizations/${orgId}/subscription`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ planTier: PlanTier.BASIC })
      .expect(200);

    // Now Org A can create custom workflow!
    const createRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        name: 'Custom Repair Flow',
        description: 'Special repair cycle',
        statuses: [
          { key: 'received', name: 'Received', customerLabel: 'We got it', category: StatusCategory.INITIAL, order: 0 },
          { key: 'fixing', name: 'Fixing', customerLabel: 'Working on it', category: StatusCategory.IN_PROGRESS, order: 1 },
          { key: 'ready', name: 'Ready', customerLabel: 'Come pick it up', category: StatusCategory.READY, order: 2 },
          { key: 'closed', name: 'Closed', customerLabel: 'Returned to customer', category: StatusCategory.COMPLETED, order: 3 },
          { key: 'cancelled', name: 'Cancelled', customerLabel: 'Cancelled', category: StatusCategory.CANCELLED, order: 4 },
        ],
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('Custom Repair Flow');
    customWorkflowId = createRes.body.data.id;
  });

  it('ORG_STAFF can GET workflows but gets 403 FORBIDDEN on writes', async () => {
    // Staff can list workflows
    const listRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .expect(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);

    // Staff can get workflow by ID
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .expect(200);

    // Staff cannot create
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/workflows`)
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .send({
        name: 'Staff Made Workflow',
        statuses: [
          { key: 'init', name: 'Init', category: StatusCategory.INITIAL, order: 0 },
          { key: 'done', name: 'Done', category: StatusCategory.COMPLETED, order: 1 },
        ],
      })
      .expect(403);

    // Staff cannot update
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .send({ name: 'Staff Renamed' })
      .expect(403);

    // Staff cannot delete
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${staffAccessToken}`)
      .expect(403);
  });

  it("Cross-tenant isolation: Org B gets 404 NOT_FOUND on Org A's workflow ID", async () => {
    // Org B GET Org A workflow -> 404
    const getRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${orgBAdminAccessToken}`)
      .expect(404);
    expect(getRes.body.error.code).toBe(ErrorCode.NOT_FOUND);

    // Org B PATCH Org A workflow -> 404
    const patchRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${orgBAdminAccessToken}`)
      .send({ name: 'Hijacked Name' })
      .expect(404);
    expect(patchRes.body.error.code).toBe(ErrorCode.NOT_FOUND);

    // Org B DELETE Org A workflow -> 404
    const deleteRes = await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${orgBAdminAccessToken}`)
      .expect(404);
    expect(deleteRes.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('ORG_ADMIN can update workflow labels and stages', async () => {
    const updateRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/workflows/${customWorkflowId}`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        description: 'Updated description for custom repair',
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.description).toBe('Updated description for custom repair');
  });

  it('Custom workflow ticket lifecycle, invalid transition rejection, and public endpoint sanitization', async () => {
    // 1. Create a ticket in Org A assigned to custom workflow
    const createTicketRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        code: 'CUST-001',
        customerName: 'Carol Customer',
        customerPhone: '555-0199',
        itemDescription: 'Vintage Turntable',
        workflowId: customWorkflowId,
      })
      .expect(201);

    const ticketId = createTicketRes.body.data.id;
    expect(createTicketRes.body.data.status).toBe('received');
    expect(createTicketRes.body.data.statusCategory).toBe('INITIAL');

    // 2. Advance to next linear stage: 'received' -> 'fixing'
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'fixing' })
      .expect(200);

    // 3. Attempt invalid jump: 'fixing' -> 'closed' (skipping 'ready') -> 409 INVALID_STATUS_TRANSITION
    const invalidJumpRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'closed' })
      .expect(409);
    expect(invalidJumpRes.body.error.code).toBe(ErrorCode.INVALID_STATUS_TRANSITION);

    // 4. Advance validly: 'fixing' -> 'ready'
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'ready' })
      .expect(200);

    // 5. Test public tracking endpoint for this ticket
    const pubRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/public/${orgSlug}/tickets/CUST-001`)
      .expect(200);

    expect(pubRes.body.success).toBe(true);
    expect(pubRes.body.data).toEqual({
      organizationName: 'Alpha Repairs',
      code: 'CUST-001',
      customerName: 'Carol Customer',
      itemDescription: 'Vintage Turntable',
      customerLabel: 'Come pick it up',
      customerDescription: '',
      category: 'READY',
      stages: [
        { customerLabel: 'We got it', customerDescription: '', category: 'INITIAL' },
        { customerLabel: 'Working on it', customerDescription: '', category: 'IN_PROGRESS' },
        { customerLabel: 'Come pick it up', customerDescription: '', category: 'READY' },
        { customerLabel: 'Returned to customer', customerDescription: '', category: 'COMPLETED' },
        { customerLabel: 'Cancelled', customerDescription: '', category: 'CANCELLED' },
      ],
      statusHistory: [
        { customerLabel: 'We got it', changedAt: expect.any(String) },
        { customerLabel: 'Working on it', changedAt: expect.any(String) },
        { customerLabel: 'Come pick it up', changedAt: expect.any(String) },
      ],
      createdAt: expect.any(String),
    });

    // Explicit privacy assertions
    expect('customerPhone' in pubRes.body.data).toBe(false);
    expect('id' in pubRes.body.data).toBe(false);
    expect('_id' in pubRes.body.data).toBe(false);
    expect('workflowId' in pubRes.body.data).toBe(false);
    expect('workflow' in pubRes.body.data).toBe(false);
    expect('name' in pubRes.body.data).toBe(false);
    expect('status' in pubRes.body.data).toBe(false);
    expect('changedBy' in pubRes.body.data.statusHistory[0]).toBe(false);

    // 6. Complete the ticket: 'ready' -> 'closed'
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'closed' })
      .expect(200);

    // 7. Attempt to transition backwards from completed status -> 409
    const backwardsRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'fixing' })
      .expect(409);
    expect(backwardsRes.body.error.code).toBe(ErrorCode.INVALID_STATUS_TRANSITION);
  });

  it('activeTickets counts only INITIAL/IN_PROGRESS/READY categories in repository and subscription usage', async () => {
    const subRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    // The completed ticket CUST-001 is COMPLETED, so activeTickets is 0
    expect(subRes.body.data.usage.activeTickets).toBe(0);

    // Create an active ticket
    const newTicketRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/tickets`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({
        code: 'ACTIVE-001',
        customerName: 'Active Customer',
        customerPhone: '555-1111',
        itemDescription: 'Active Repair Job',
        workflowId: customWorkflowId,
      })
      .expect(201);

    const activeSubRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);

    // Active ticket is in INITIAL category, so activeTickets count is 1
    expect(activeSubRes.body.data.usage.activeTickets).toBe(1);

    // Advance to IN_PROGRESS
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${newTicketRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'fixing' })
      .expect(200);

    const inProgressSubRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);
    expect(inProgressSubRes.body.data.usage.activeTickets).toBe(1);

    // Advance to READY
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${newTicketRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'ready' })
      .expect(200);

    const readySubRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);
    expect(readySubRes.body.data.usage.activeTickets).toBe(1);

    // Move to CANCELLED
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/tickets/${newTicketRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .send({ status: 'cancelled' })
      .expect(200);

    const cancelledSubRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/organizations/me/subscription`)
      .set('Authorization', `Bearer ${orgAdminAccessToken}`)
      .expect(200);
    expect(cancelledSubRes.body.data.usage.activeTickets).toBe(0);
  });
});
