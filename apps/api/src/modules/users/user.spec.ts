import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Role } from '@trackit/types';
import { ErrorCode } from '../../constants';
import { OTP_MAX_ATTEMPTS } from '../auth/auth.constants';
import { EmailService } from '../email/email.service';
import { RolesService } from '../roles/role.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { UsersRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UsersService } from './user.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let emailService: jest.Mocked<EmailService>;
  let rolesService: jest.Mocked<RolesService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockRepository = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    findByEmailWithOtp: jest.fn(),
    setEmailOtp: jest.fn(),
    incrementOtpAttempts: jest.fn(),
    markEmailVerified: jest.fn(),
    countByOrganizationId: jest.fn(),
    countAdminsInOrg: jest.fn(),
    findByOrganization: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const mockRolesService = {
    getRoleByKey: jest.fn(),
  };

  const mockSubscriptionsService = {
    assertPlanLimit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    emailService = module.get(EmailService);
    rolesService = module.get(RolesService);
    subscriptionsService = module.get(SubscriptionsService);
  });

  describe('createUser', () => {
    it('should hash password with SALT_ROUNDS before persisting', async () => {
      const orgId = new Types.ObjectId();
      const plainPassword = 'PlainPassword123!';

      repository.create.mockImplementation(async (doc) => {
        return {
          ...doc,
          _id: new Types.ObjectId(),
        } as unknown as UserDocument;
      });

      await service.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: plainPassword,
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
      const createdArg = repository.create.mock.calls[0][0];

      expect(createdArg.passwordHash).toBeDefined();
      expect(createdArg.passwordHash).not.toEqual(plainPassword);

      const isValidHash = await bcrypt.compare(
        plainPassword,
        createdArg.passwordHash!,
      );
      expect(isValidHash).toBe(true);
      expect(createdArg.email).toBe('test@example.com');
      expect(createdArg.organizationId).toEqual(orgId);
    });
  });

  describe('findByEmail', () => {
    it('should query repository by email', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
      } as unknown as UserDocument;
      repository.findByEmailWithPassword.mockResolvedValue(userMock);

      const result = await service.findByEmail('test@example.com');
      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toBe(userMock);
    });
  });

  describe('findById', () => {
    it('should query repository by ID', async () => {
      const userId = new Types.ObjectId().toString();
      const userMock = {
        _id: new Types.ObjectId(userId),
        email: 'test@example.com',
      } as unknown as UserDocument;
      repository.findById.mockResolvedValue(userMock);

      const result = await service.findById(userId);
      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(userMock);
    });
  });

  describe('updateRefreshTokenHash', () => {
    it('should call repository to update hash', async () => {
      const userId = new Types.ObjectId().toString();
      const userMock = {
        _id: new Types.ObjectId(userId),
        refreshTokenHash: 'hash',
      } as unknown as UserDocument;
      repository.updateRefreshTokenHash.mockResolvedValue(userMock);

      const result = await service.updateRefreshTokenHash(userId, 'hash');
      expect(repository.updateRefreshTokenHash).toHaveBeenCalledWith(
        userId,
        'hash',
      );
      expect(result).toBe(userMock);
    });
  });

  describe('clearRefreshTokenHash', () => {
    it('should update hash with null', async () => {
      const userId = new Types.ObjectId().toString();
      repository.updateRefreshTokenHash.mockResolvedValue(null);

      await service.clearRefreshTokenHash(userId);
      expect(repository.updateRefreshTokenHash).toHaveBeenCalledWith(
        userId,
        null,
      );
    });
  });

  describe('sendEmailVerificationOtp', () => {
    it('should generate 6-digit OTP, store SHA-256 hash, and send email', async () => {
      const userId = new Types.ObjectId();
      repository.setEmailOtp.mockResolvedValue({} as UserDocument);

      await service.sendEmailVerificationOtp(
        userId,
        'test@example.com',
        'Test User',
      );

      expect(repository.setEmailOtp).toHaveBeenCalledTimes(1);
      const [calledUserId, calledHash, calledExpiry] =
        repository.setEmailOtp.mock.calls[0];

      expect(calledUserId).toBe(userId.toString());
      expect(calledHash).toHaveLength(64);
      expect(calledExpiry.getTime()).toBeGreaterThan(Date.now());
      expect(emailService.send).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledWith(
        'test@example.com',
        'Verify your email address',
        expect.anything(),
      );
    });
  });

  describe('verifyEmailOtp', () => {
    it('should verify correct OTP and mark email verified', async () => {
      const userId = new Types.ObjectId();
      const rawOtp = '123456';
      const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

      const userMock = {
        _id: userId,
        email: 'test@example.com',
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        emailOtpAttempts: 0,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);
      repository.markEmailVerified.mockResolvedValue(userMock);

      await service.verifyEmailOtp('test@example.com', rawOtp);

      expect(repository.markEmailVerified).toHaveBeenCalledWith(
        userId.toString(),
      );
      expect(repository.incrementOtpAttempts).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      repository.findByEmailWithOtp.mockResolvedValue(null);

      await expect(
        service.verifyEmailOtp('test@example.com', '123456'),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should throw EMAIL_ALREADY_VERIFIED if already verified', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        emailVerified: true,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('test@example.com', '123456'),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: ErrorCode.EMAIL_ALREADY_VERIFIED,
      });
    });

    it('should throw OTP_EXPIRED if OTP expired', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        emailVerified: false,
        emailOtpHash: 'hash',
        emailOtpExpiresAt: new Date(Date.now() - 1000),
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('test@example.com', '123456'),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.OTP_EXPIRED,
      });
    });

    it('should throw OTP_MAX_ATTEMPTS_EXCEEDED if max attempts reached', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        emailVerified: false,
        emailOtpHash: 'hash',
        emailOtpExpiresAt: new Date(Date.now() + 10000),
        emailOtpAttempts: OTP_MAX_ATTEMPTS,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('test@example.com', '123456'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED,
      });
    });

    it('should increment attempts and throw OTP_INVALID if OTP is wrong', async () => {
      const userId = new Types.ObjectId();
      const rawOtp = '123456';
      const wrongOtp = '654321';
      const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

      const userMock = {
        _id: userId,
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() + 10000),
        emailOtpAttempts: 0,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('test@example.com', wrongOtp),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.OTP_INVALID,
      });

      expect(repository.incrementOtpAttempts).toHaveBeenCalledWith(
        userId.toString(),
      );
      expect(repository.markEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendEmailVerificationOtp', () => {
    it('should resend verification OTP if user exists and not verified', async () => {
      const userId = new Types.ObjectId();
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        name: 'Alice',
        emailVerified: false,
      } as unknown as UserDocument;

      repository.findByEmailWithPassword.mockResolvedValue(userMock);
      repository.setEmailOtp.mockResolvedValue(userMock);

      await service.resendEmailVerificationOtp('user@example.com');

      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(repository.setEmailOtp).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.resendEmailVerificationOtp('nonexistent@example.com'),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should throw EMAIL_ALREADY_VERIFIED if user is already verified', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        name: 'Alice',
        emailVerified: true,
      } as unknown as UserDocument;

      repository.findByEmailWithPassword.mockResolvedValue(userMock);

      await expect(
        service.resendEmailVerificationOtp('user@example.com'),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: ErrorCode.EMAIL_ALREADY_VERIFIED,
      });
    });
  });

  describe('listStaffByOrganization', () => {
    it('should return all staff belonging to organization', async () => {
      const orgId = new Types.ObjectId().toString();
      const mockStaff = [
        { _id: new Types.ObjectId(), name: 'Admin', role: Role.ORG_ADMIN },
        { _id: new Types.ObjectId(), name: 'Staff', role: Role.ORG_STAFF },
      ] as UserDocument[];

      repository.findByOrganization.mockResolvedValue(mockStaff);

      const result = await service.listStaffByOrganization(orgId);
      expect(repository.findByOrganization).toHaveBeenCalledWith(orgId);
      expect(result).toBe(mockStaff);
    });
  });

  describe('createStaffUser', () => {
    it('should forbid assigning SUPERADMIN role', async () => {
      const orgId = new Types.ObjectId().toString();
      await expect(
        service.createStaffUser(orgId, {
          email: 'test@example.com',
          name: 'Super',
          password: 'password123',
          role: Role.SUPERADMIN,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
        code: ErrorCode.FORBIDDEN,
      });
    });

    it('should throw CONFLICT if email already in use', async () => {
      const orgId = new Types.ObjectId().toString();
      repository.findByEmailWithPassword.mockResolvedValue({
        _id: new Types.ObjectId(),
      } as UserDocument);

      await expect(
        service.createStaffUser(orgId, {
          email: 'existing@example.com',
          name: 'Staff',
          password: 'password123',
          role: Role.ORG_STAFF,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONFLICT,
      });
    });

    it('should throw ROLE_NOT_FOUND if custom role key does not exist', async () => {
      const orgId = new Types.ObjectId().toString();
      repository.findByEmailWithPassword.mockResolvedValue(null);
      rolesService.getRoleByKey.mockResolvedValue(null);

      await expect(
        service.createStaffUser(orgId, {
          email: 'new@example.com',
          name: 'Staff',
          password: 'password123',
          role: 'NON_EXISTENT_ROLE',
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.ROLE_NOT_FOUND,
      });
    });

    it('should check plan limits and create staff user', async () => {
      const orgId = new Types.ObjectId().toString();
      repository.findByEmailWithPassword.mockResolvedValue(null);
      repository.countByOrganizationId.mockResolvedValue(2);
      subscriptionsService.assertPlanLimit.mockResolvedValue(undefined);
      repository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        email: 'new@example.com',
        name: 'New Staff',
        role: Role.ORG_STAFF,
      } as UserDocument);

      const result = await service.createStaffUser(orgId, {
        email: 'new@example.com',
        name: 'New Staff',
        password: 'password123',
        role: Role.ORG_STAFF,
      });

      expect(subscriptionsService.assertPlanLimit).toHaveBeenCalledWith(
        orgId,
        'maxStaffUsers',
        2,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New Staff',
          role: Role.ORG_STAFF,
          isActive: true,
          emailVerified: true,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateStaffUser', () => {
    it('should throw USER_NOT_FOUND if user does not belong to organization', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateStaffUser(orgId, userId, 'admin-id', { name: 'Updated' }),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.USER_NOT_FOUND,
      });
    });

    it('should throw CANNOT_DELETE_SELF if deactivating own account', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      repository.findById.mockResolvedValue({
        _id: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        role: Role.ORG_ADMIN,
      } as unknown as UserDocument);

      await expect(
        service.updateStaffUser(orgId, userId, userId, { isActive: false }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.CANNOT_DELETE_SELF,
      });
    });

    it('should throw CANNOT_REMOVE_LAST_ADMIN if demoting the only active admin', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      repository.findById.mockResolvedValue({
        _id: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        role: Role.ORG_ADMIN,
      } as unknown as UserDocument);
      repository.countAdminsInOrg.mockResolvedValue(1);

      await expect(
        service.updateStaffUser(orgId, userId, 'other-id', {
          role: Role.ORG_STAFF,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
      });
    });
  });

  describe('deleteStaffUser', () => {
    it('should throw CANNOT_DELETE_SELF if deleting own account', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      await expect(
        service.deleteStaffUser(orgId, userId, userId),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.CANNOT_DELETE_SELF,
      });
    });

    it('should throw CANNOT_REMOVE_LAST_ADMIN if deleting the only active admin', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      repository.findById.mockResolvedValue({
        _id: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        role: Role.ORG_ADMIN,
      } as unknown as UserDocument);
      repository.countAdminsInOrg.mockResolvedValue(1);

      await expect(
        service.deleteStaffUser(orgId, userId, 'other-id'),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
      });
    });

    it('should delete user if conditions met', async () => {
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      repository.findById.mockResolvedValue({
        _id: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        role: Role.ORG_STAFF,
      } as unknown as UserDocument);
      repository.deleteById.mockResolvedValue({} as UserDocument);

      await service.deleteStaffUser(orgId, userId, 'admin-id');
      expect(repository.deleteById).toHaveBeenCalledWith(userId);
    });
  });
});
