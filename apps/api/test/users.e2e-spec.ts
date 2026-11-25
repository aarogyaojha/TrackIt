import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PlanTier, Role } from '@trackit/types';
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

describe('Users & Team Management Module (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let orgAdminUserId: string;
  let orgId: string;
  let createdStaffId: string;

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

    // 1. Seed superadmin
    const superadmin = await usersService.createUser({
      email: 'superadmin@trackit.internal',
      name: 'Super Admin',
      password: 'SuperadminPassword123!',
      role: Role.SUPERADMIN,
      organizationId: null,
    });
    await usersRepository.markEmailVerified(superadmin._id.toString());

    const superadminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'superadmin@trackit.internal',
        password: 'SuperadminPassword123!',
      })
      .expect(200);

    superadminAccessToken = superadminLogin.body.data.accessToken;

    // 2. Register organization
    const orgReg = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/register`)
      .send({
        orgName: 'Team Test Org',
        adminName: 'Team Admin',
        adminEmail: 'admin@teamtest.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    orgId = orgReg.body.data.organization.id;

    const orgAdminUser = await usersRepository.findByEmailWithPassword('admin@teamtest.com');
    await usersRepository.markEmailVerified(orgAdminUser!._id.toString());
    orgAdminUserId = orgAdminUser!._id.toString();

    // Approve organization
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    // Upgrade org plan to PRO so maxStaffUsers is 20
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/organizations/${orgId}/subscription`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .send({ planTier: PlanTier.PRO })
      .expect(200);

    const orgAdminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'admin@teamtest.com',
        password: 'Password123!',
      })
      .expect(200);

    orgAdminAccessToken = orgAdminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('GET /users', () => {
    it('should list staff members of the organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('admin@teamtest.com');
    });
  });

  describe('POST /users', () => {
    it('should forbid assigning SUPERADMIN role (case-insensitive) to tenant staff', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Hacker Staff',
          email: 'hacker@teamtest.com',
          password: 'Password123!',
          role: 'superadmin',
        })
        .expect(403);

      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should reject creating staff user with weak password', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Weak Pass Staff',
          email: 'weak@teamtest.com',
          password: 'weakpassword',
          role: Role.ORG_STAFF,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create new staff member in organization', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Jane Staff',
          email: 'jane@teamtest.com',
          password: 'Password123!',
          role: Role.ORG_STAFF,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane Staff');
      expect(res.body.data.email).toBe('jane@teamtest.com');
      expect(res.body.data.role).toBe(Role.ORG_STAFF);
      expect(res.body.data.isActive).toBe(true);

      createdStaffId = res.body.data.id;
    });

    it('should reject creating user with existing email', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Duplicate Staff',
          email: 'jane@teamtest.com',
          password: 'Password123!',
          role: Role.ORG_STAFF,
        })
        .expect(409);

      expect(res.body.error.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update staff member details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/users/${createdStaffId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Jane Senior Staff',
          isActive: false,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane Senior Staff');
      expect(res.body.data.isActive).toBe(false);
    });

    it('should forbid deactivating own account', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/users/${orgAdminUserId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          isActive: false,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.CANNOT_DELETE_SELF);
    });

    it('should forbid removing the last remaining admin role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/users/${orgAdminUserId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          role: Role.ORG_STAFF,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.CANNOT_REMOVE_LAST_ADMIN);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should forbid deleting own account', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/users/${orgAdminUserId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.CANNOT_DELETE_SELF);
    });

    it('should immediately reject existing access token after staff user is deactivated', async () => {
      // Create and log in a temporary staff member
      const createRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Temp Staff',
          email: 'temp@teamtest.com',
          password: 'Password123!',
          role: Role.ORG_STAFF,
        })
        .expect(201);

      const tempId = createRes.body.data.id;

      const loginRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/login`)
        .send({
          email: 'temp@teamtest.com',
          password: 'Password123!',
        })
        .expect(200);

      const tempToken = loginRes.body.data.accessToken;

      // Deactivate staff member
      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/users/${tempId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({ isActive: false })
        .expect(200);

      // Existing access token must be rejected immediately
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/tickets`)
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(401);
    });

    it('should successfully remove staff member', async () => {
      await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/users/${createdStaffId}`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .expect(204);

      // Verify staff member is removed
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .expect(200);

      const found = listRes.body.data.some((u: { id: string }) => u.id === createdStaffId);
      expect(found).toBe(false);
    });
  });
});
