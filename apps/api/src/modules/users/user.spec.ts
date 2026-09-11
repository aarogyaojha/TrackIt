import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { Role } from '@trackit/types';
import { ErrorCode } from '../../constants';
import { OTP_MAX_ATTEMPTS } from '../auth/auth.constants';
import { EmailService } from '../email/email.service';
import { UsersRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UsersService } from './user.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let emailService: jest.Mocked<EmailService>;

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
  };

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    emailService = module.get(EmailService);
  });

  describe('createUser', () => {
    it('should hash password with SALT_ROUNDS before persisting', async () => {
      const orgId = new Types.ObjectId();
      const plainPassword = 'PlainPassword123!';
      const dto = {
        email: 'TEST@example.com',
        password: plainPassword,
        name: 'Test User',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      };

      const createdUserMock = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
        passwordHash: 'hashed_password',
        isActive: true,
      } as unknown as UserDocument;

      repository.create.mockResolvedValue(createdUserMock);

      const result = await service.createUser(dto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      const passedDoc = repository.create.mock.calls[0][0];

      expect(passedDoc.email).toBe('test@example.com');
      expect(passedDoc.name).toBe('Test User');
      expect(passedDoc.role).toBe(Role.ORG_ADMIN);
      expect(passedDoc.organizationId).toEqual(orgId);
      expect(passedDoc.passwordHash).not.toBe(plainPassword);

      // Verify bcrypt hash matches the password
      const isMatch = await bcrypt.compare(
        plainPassword,
        passedDoc.passwordHash!,
      );
      expect(isMatch).toBe(true);

      expect(result).toBe(createdUserMock);
    });
  });

  describe('findByEmail', () => {
    it('should return user document when found', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'found@example.com',
        passwordHash: 'some_hash',
      } as unknown as UserDocument;

      repository.findByEmailWithPassword.mockResolvedValue(userMock);

      const result = await service.findByEmail('found@example.com');

      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'found@example.com',
      );
      expect(result).toBe(userMock);
    });

    it('should return null when user is not found', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'notfound@example.com',
      );
      expect(result).toBeNull();
    });
  });

  describe('sendEmailVerificationOtp', () => {
    it('should generate a 6-digit OTP, store SHA-256 hash in DB, and send email', async () => {
      const userId = new Types.ObjectId().toString();
      const email = 'user@example.com';
      const name = 'Alice';

      repository.setEmailOtp.mockResolvedValue({} as UserDocument);

      await service.sendEmailVerificationOtp(userId, email, name);

      expect(repository.setEmailOtp).toHaveBeenCalledTimes(1);
      const [calledUserId, calledHash, calledExpiry] =
        repository.setEmailOtp.mock.calls[0];

      expect(calledUserId).toBe(userId);
      expect(typeof calledHash).toBe('string');
      expect(calledHash.length).toBe(64); // SHA-256 hex length
      expect(calledExpiry.getTime()).toBeGreaterThan(Date.now());

      expect(emailService.send).toHaveBeenCalledTimes(1);
      const [to, subject, template] = emailService.send.mock.calls[0];
      expect(to).toBe(email);
      expect(subject).toBe('Verify your email address');
      expect(template).toBeDefined();
    });
  });

  describe('verifyEmailOtp', () => {
    const userId = new Types.ObjectId();
    const rawOtp = '123456';
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    it('should successfully verify when OTP is correct', async () => {
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        emailOtpAttempts: 0,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);
      repository.markEmailVerified.mockResolvedValue(userMock);

      await service.verifyEmailOtp('user@example.com', rawOtp);

      expect(repository.findByEmailWithOtp).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(repository.markEmailVerified).toHaveBeenCalledWith(
        userId.toString(),
      );
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      repository.findByEmailWithOtp.mockResolvedValue(null);

      await expect(
        service.verifyEmailOtp('nonexistent@example.com', rawOtp),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should throw EMAIL_ALREADY_VERIFIED if user is already verified', async () => {
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        emailVerified: true,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('user@example.com', rawOtp),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        code: ErrorCode.EMAIL_ALREADY_VERIFIED,
      });
    });

    it('should throw OTP_EXPIRED if OTP expiration has passed', async () => {
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() - 1000),
        emailOtpAttempts: 0,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('user@example.com', rawOtp),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.OTP_EXPIRED,
      });
    });

    it('should throw OTP_MAX_ATTEMPTS_EXCEEDED when attempts >= 5', async () => {
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        emailOtpAttempts: OTP_MAX_ATTEMPTS,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('user@example.com', rawOtp),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED,
      });
    });

    it('should increment attempts and throw OTP_INVALID on wrong OTP', async () => {
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        emailVerified: false,
        emailOtpHash: otpHash,
        emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        emailOtpAttempts: 1,
      } as unknown as UserDocument;

      repository.findByEmailWithOtp.mockResolvedValue(userMock);
      repository.incrementOtpAttempts.mockResolvedValue(userMock);

      await expect(
        service.verifyEmailOtp('user@example.com', '999999'),
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
});
