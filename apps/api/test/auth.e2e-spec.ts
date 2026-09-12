import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { OrgStatus } from '@trackit/types';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import { API_PREFIX, ErrorCode } from '../src/constants';
import { EmailService } from '../src/modules/email/email.service';
import { OrganizationsRepository } from '../src/modules/organizations/organization.repository';
import { UsersRepository } from '../src/modules/users/user.repository';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './mongo-memory-server.helper';

describe('Auth & Organizations Flow (e2e)', () => {
  let app: INestApplication;
  let mongoUri: string;
  let orgsRepository: OrganizationsRepository;
  let usersRepository: UsersRepository;

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

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
    orgsRepository = app.get(OrganizationsRepository);
    usersRepository = app.get(UsersRepository);
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

    // Directly set emailVerified: true to unblock org-approval and session tests below
    const user = await usersRepository.findByEmailWithPassword(
      'admin@apexauto.com',
    );
    expect(user).toBeDefined();
    await usersRepository.updateById(user!._id.toString(), {
      $set: { emailVerified: true },
    });
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
    const cookiesArr = Array.isArray(cookies) ? cookies : [cookies];
    const refreshCookie = cookiesArr.find((c: string) =>
      c.includes('refreshToken='),
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain(`Path=/${API_PREFIX}/auth`);
    expect(refreshCookie!.toLowerCase()).toContain('httponly');

    const refreshTokenMatch = refreshCookie!.match(/refreshToken=([^;]+)/);
    expect(refreshTokenMatch).toBeTruthy();
    rawRefreshToken = refreshTokenMatch![1];

    const hasSessionCookie = cookiesArr.find((c: string) =>
      c.includes('has_session='),
    );
    expect(hasSessionCookie).toBeDefined();
    expect(hasSessionCookie).toContain('Path=/');
    expect(hasSessionCookie).not.toContain('Path=/auth');
    expect(hasSessionCookie!.toLowerCase()).toContain('httponly');
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
    const rotatedCookiesArr = Array.isArray(rotatedCookies)
      ? rotatedCookies
      : [rotatedCookies];
    const newRefreshCookie = rotatedCookiesArr.find((c: string) =>
      c.includes('refreshToken='),
    );
    expect(newRefreshCookie).toBeDefined();
    const newRefreshTokenMatch = newRefreshCookie!.match(/refreshToken=([^;]+)/);
    expect(newRefreshTokenMatch).toBeTruthy();
    newRawRefreshToken = newRefreshTokenMatch![1];
  });

  it(`POST /${API_PREFIX}/auth/logout — logs out user, clears refresh cookie, and invalidates stored refresh token hash`, async () => {
    const logoutRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/logout`)
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    expect(logoutRes.body.success).toBe(true);

    const logoutCookies = logoutRes.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
    const logoutCookiesArr = Array.isArray(logoutCookies)
      ? logoutCookies
      : [logoutCookies];
    const clearedRefresh = logoutCookiesArr.find((c: string) =>
      c.includes('refreshToken='),
    );
    expect(clearedRefresh).toBeDefined();
    expect(clearedRefresh).toContain(`Path=/${API_PREFIX}/auth`);
    expect(clearedRefresh).toMatch(
      /refreshToken=;.*Expires=Thu, 01 Jan 1970 00:00:00 GMT/,
    );

    const clearedHasSession = logoutCookiesArr.find((c: string) =>
      c.includes('has_session='),
    );
    expect(clearedHasSession).toBeDefined();
    expect(clearedHasSession).toContain('Path=/');
    expect(clearedHasSession).not.toContain('Path=/auth');
    expect(clearedHasSession).toMatch(
      /has_session=;.*Expires=Thu, 01 Jan 1970 00:00:00 GMT/,
    );
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

  describe('OTP Email Verification Flow (e2e)', () => {
    let verifyOrgId: string;
    let extractedOtp: string;

    it('registers an organization and dispatches verification email with OTP', async () => {
      mockEmailService.send.mockClear();

      const regRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/organizations/register`)
        .send({
          orgName: 'Verification Test Garage',
          adminName: 'Victor Tester',
          adminEmail: 'victor@verifygarage.com',
          adminPassword: 'Password123!',
        })
        .expect(201);

      verifyOrgId = regRes.body.data.organization.id;
      expect(verifyOrgId).toBeDefined();

      // Activate organization to isolate email-verification check
      await orgsRepository.updateById(verifyOrgId, {
        $set: { status: OrgStatus.ACTIVE },
      });

      expect(mockEmailService.send).toHaveBeenCalledTimes(1);
      const [to, subject, templateElement] = mockEmailService.send.mock.calls[0];
      expect(to).toBe('victor@verifygarage.com');
      expect(subject).toBe('Verify your email address');
      expect(templateElement?.props?.otp).toBeDefined();
      expect(templateElement.props.otp).toMatch(/^\d{6}$/);

      extractedOtp = templateElement.props.otp;
    });

    it('rejects login with 403 EMAIL_NOT_VERIFIED before verification', async () => {
      const loginRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/login`)
        .send({
          email: 'victor@verifygarage.com',
          password: 'Password123!',
        })
        .expect(403);

      expect(loginRes.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.EMAIL_NOT_VERIFIED,
        },
      });
    });

    it('POST /auth/verify-email rejects wrong OTP with 400 OTP_INVALID', async () => {
      const wrongOtp = extractedOtp === '111111' ? '222222' : '111111';

      const verifyRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/verify-email`)
        .send({
          email: 'victor@verifygarage.com',
          otp: wrongOtp,
        })
        .expect(400);

      expect(verifyRes.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.OTP_INVALID,
        },
      });
    });

    it('POST /auth/verify-email succeeds with correct OTP', async () => {
      const verifyRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/verify-email`)
        .send({
          email: 'victor@verifygarage.com',
          otp: extractedOtp,
        })
        .expect(200);

      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data).toMatchObject({
        message: 'Email verified successfully',
      });
    });

    it('POST /auth/verify-email returns 409 EMAIL_ALREADY_VERIFIED when verified again', async () => {
      const reVerifyRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/verify-email`)
        .send({
          email: 'victor@verifygarage.com',
          otp: extractedOtp,
        })
        .expect(409);

      expect(reVerifyRes.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.EMAIL_ALREADY_VERIFIED,
        },
      });
    });

    it('POST /auth/login succeeds after email verification', async () => {
      const loginRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/login`)
        .send({
          email: 'victor@verifygarage.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
      expect(loginRes.body.data.user).toMatchObject({
        email: 'victor@verifygarage.com',
        role: 'ORG_ADMIN',
        organizationId: verifyOrgId,
      });
    });

    it('POST /auth/resend-email-verification returns 409 EMAIL_ALREADY_VERIFIED for verified user', async () => {
      const resendRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/resend-email-verification`)
        .send({
          email: 'victor@verifygarage.com',
        })
        .expect(409);

      expect(resendRes.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.EMAIL_ALREADY_VERIFIED,
        },
      });
    });

    it('POST /auth/resend-email-verification resends OTP for unverified user', async () => {
      // Register a new unverified user
      mockEmailService.send.mockClear();

      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/organizations/register`)
        .send({
          orgName: 'Resend Test Tailors',
          adminName: 'Rita Resend',
          adminEmail: 'rita@resendtailors.com',
          adminPassword: 'Password123!',
        })
        .expect(201);

      expect(mockEmailService.send).toHaveBeenCalledTimes(1);

      const resendRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/auth/resend-email-verification`)
        .send({
          email: 'rita@resendtailors.com',
        })
        .expect(200);

      expect(resendRes.body.success).toBe(true);
      expect(resendRes.body.data).toMatchObject({
        message: 'Verification email sent successfully',
      });
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);
    });
  });
});
