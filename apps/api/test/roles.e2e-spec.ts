import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { Permission, Role } from '@trackit/types';
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

describe('Roles & Permissions Module (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  let superadminAccessToken: string;
  let orgAdminAccessToken: string;
  let orgId: string;
  let customRoleId: string;

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
        orgName: 'Role Test Org',
        adminName: 'Role Admin',
        adminEmail: 'admin@roletest.com',
        adminPassword: 'Password123!',
      })
      .expect(201);

    orgId = orgReg.body.data.organization.id;

    const orgAdminUser = await usersRepository.findByEmailWithPassword('admin@roletest.com');
    await usersRepository.markEmailVerified(orgAdminUser!._id.toString());

    // Approve organization
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/organizations/${orgId}/approve`)
      .set('Authorization', `Bearer ${superadminAccessToken}`)
      .expect(200);

    const orgAdminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: 'admin@roletest.com',
        password: 'Password123!',
      })
      .expect(200);

    orgAdminAccessToken = orgAdminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('GET /roles', () => {
    it('should list all roles including default system roles', async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const keys = res.body.data.map((r: { key: string }) => r.key);
      expect(keys).toContain('SUPERADMIN');
      expect(keys).toContain('ORG_ADMIN');
      expect(keys).toContain('ORG_STAFF');
    });

    it('should forbid ORG_STAFF without ROLES_READ permission from listing roles', async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/users`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Staff Reader Check',
          email: 'staffcheck@roletest.com',
          password: 'Password123!',
          role: Role.ORG_STAFF,
        })
        .expect(201);

      const staffLogin = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/login`)
        .send({
          email: 'staffcheck@roletest.com',
          password: 'Password123!',
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${staffLogin.body.data.accessToken}`)
        .expect(403);

      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  describe('POST /roles', () => {
    it('should forbid non-superadmin users from creating roles', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${orgAdminAccessToken}`)
        .send({
          name: 'Junior Mechanic',
          key: 'JUNIOR_MECHANIC',
          description: 'Basic ticket reader',
          permissions: [Permission.TICKETS_READ],
        })
        .expect(403);

      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should forbid superadmin from creating a custom role with PLATFORM_ALL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Wildcard Role',
          key: 'WILDCARD_ROLE',
          permissions: [Permission.PLATFORM_ALL],
        })
        .expect(403);

      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should allow superadmin to create a custom role', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Technician',
          key: 'TECHNICIAN',
          description: 'Technical staff with status progression rights',
          permissions: [
            Permission.TICKETS_READ,
            Permission.TICKETS_UPDATE_STATUS,
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBe('TECHNICIAN');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toEqual(
        expect.arrayContaining([
          Permission.TICKETS_READ,
          Permission.TICKETS_UPDATE_STATUS,
        ]),
      );

      customRoleId = res.body.data.id;
    });

    it('should reject creating duplicate role key', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Technician Duplicate',
          key: 'TECHNICIAN',
          permissions: [Permission.TICKETS_READ],
        })
        .expect(409);

      expect(res.body.error.code).toBe(ErrorCode.ROLE_KEY_EXISTS);
    });
  });

  describe('PATCH /roles/:id', () => {
    it('should allow superadmin to update custom role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Senior Technician',
          description: 'Updated technician role',
          permissions: [
            Permission.TICKETS_READ,
            Permission.TICKETS_UPDATE_STATUS,
            Permission.TICKETS_UPDATE,
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Senior Technician');
      expect(res.body.data.permissions).toContain(Permission.TICKETS_UPDATE);
    });

    it('should forbid renaming built-in system role', async () => {
      // Find system role ORG_STAFF
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .expect(200);

      const staffRole = listRes.body.data.find(
        (r: { key: string }) => r.key === 'ORG_STAFF',
      );

      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/roles/${staffRole.id}`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Renamed Staff',
        })
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.ROLE_CANNOT_DELETE_SYSTEM);
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should forbid deleting built-in system role', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/roles`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .expect(200);

      const staffRole = listRes.body.data.find(
        (r: { key: string }) => r.key === 'ORG_STAFF',
      );

      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/roles/${staffRole.id}`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.ROLE_CANNOT_DELETE_SYSTEM);
    });

    it('should allow deleting custom role', async () => {
      await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .expect(204);

      // Verify role is gone
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .expect(404);
    });
  });
});
