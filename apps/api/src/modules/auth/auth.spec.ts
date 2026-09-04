import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { OrgStatus, Role } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode } from '../../constants';
import { OrganizationsService } from '../organizations/organization.service';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    clearRefreshTokenHash: jest.fn(),
  };

  const mockOrganizationsService = {
    getById: jest.fn(),
    getBySlug: jest.fn(),
    registerOrganization: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockAppConfigService = {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtAccessExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    isProduction: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateCredentials', () => {
    const rawPassword = 'CorrectPassword123!';
    let passwordHash: string;
    const orgId = new Types.ObjectId();

    beforeAll(async () => {
      passwordHash = await bcrypt.hash(rawPassword, 10);
    });

    it('should successfully validate credentials for active user and approved org', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
        passwordHash,
        isActive: true,
      } as unknown as UserDocument;

      mockUsersService.findByEmail.mockResolvedValue(userMock);
      mockOrganizationsService.getById.mockResolvedValue({
        _id: orgId,
        name: 'Apex Org',
        status: OrgStatus.ACTIVE,
      } as unknown as ReturnType<OrganizationsService['getById']> extends Promise<infer U> ? U : never);

      const result = await service.validateCredentials(
        'user@example.com',
        rawPassword,
      );

      expect(result).toBe(userMock);
    });

    it('should throw INVALID_CREDENTIALS when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateCredentials('unknown@example.com', rawPassword),
      ).rejects.toThrow(AppException);

      try {
        await service.validateCredentials('unknown@example.com', rawPassword);
      } catch (err: unknown) {
        const appErr = err as AppException;
        expect(appErr.code).toBe(ErrorCode.INVALID_CREDENTIALS);
        expect(appErr.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should throw INVALID_CREDENTIALS when password is incorrect', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        passwordHash,
        isActive: true,
      } as unknown as UserDocument;

      mockUsersService.findByEmail.mockResolvedValue(userMock);

      await expect(
        service.validateCredentials('user@example.com', 'WrongPassword123!'),
      ).rejects.toThrow(AppException);

      try {
        await service.validateCredentials(
          'user@example.com',
          'WrongPassword123!',
        );
      } catch (err: unknown) {
        const appErr = err as AppException;
        expect(appErr.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      }
    });

    it('should throw ORG_NOT_APPROVED when user belongs to a pending or suspended org', async () => {
      const userMock = {
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
        passwordHash,
        isActive: true,
      } as unknown as UserDocument;

      mockUsersService.findByEmail.mockResolvedValue(userMock);
      mockOrganizationsService.getById.mockResolvedValue({
        _id: orgId,
        status: OrgStatus.PENDING,
      } as unknown as ReturnType<OrganizationsService['getById']> extends Promise<infer U> ? U : never);

      await expect(
        service.validateCredentials('user@example.com', rawPassword),
      ).rejects.toThrow(AppException);

      try {
        await service.validateCredentials('user@example.com', rawPassword);
      } catch (err: unknown) {
        const appErr = err as AppException;
        expect(appErr.code).toBe(ErrorCode.ORG_NOT_APPROVED);
        expect(appErr.getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });
  });

  describe('login', () => {
    it('should issue both access and refresh tokens and store SHA-256 hash on user', async () => {
      const userId = new Types.ObjectId();
      const orgId = new Types.ObjectId();
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      } as unknown as UserDocument;

      mockJwtService.signAsync
        .mockResolvedValueOnce('signed_access_token')
        .mockResolvedValueOnce('signed_refresh_token');

      const result = await service.login(userMock);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('signed_access_token');
      expect(result.refreshToken).toBe('signed_refresh_token');
      expect(result.user).toEqual({
        id: userId.toString(),
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId.toString(),
      });

      const expectedHash = crypto
        .createHash('sha256')
        .update('signed_refresh_token')
        .digest('hex');

      expect(mockUsersService.updateRefreshTokenHash).toHaveBeenCalledWith(
        userId.toString(),
        expectedHash,
      );
    });
  });

  describe('refresh', () => {
    const rawRefreshToken = 'valid_raw_refresh_token';
    const rawRefreshTokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    it('should rotate tokens and update stored hash when refresh token is valid', async () => {
      const userId = new Types.ObjectId();
      const orgId = new Types.ObjectId();

      const userMock = {
        _id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
        isActive: true,
        refreshTokenHash: rawRefreshTokenHash,
      } as unknown as UserDocument;

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: userId.toString(),
        type: 'refresh',
      });
      mockUsersService.findByIdWithRefreshToken.mockResolvedValue(userMock);
      mockOrganizationsService.getById.mockResolvedValue({
        _id: orgId,
        status: OrgStatus.ACTIVE,
      } as unknown as ReturnType<OrganizationsService['getById']> extends Promise<infer U> ? U : never);

      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await service.refresh(rawRefreshToken);

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');

      const newExpectedHash = crypto
        .createHash('sha256')
        .update('new_refresh_token')
        .digest('hex');

      expect(mockUsersService.updateRefreshTokenHash).toHaveBeenCalledWith(
        userId.toString(),
        newExpectedHash,
      );
    });

    it('should reject when refresh token is tampered or mismatched', async () => {
      const userId = new Types.ObjectId();
      const userMock = {
        _id: userId,
        email: 'user@example.com',
        role: Role.ORG_ADMIN,
        organizationId: null,
        isActive: true,
        refreshTokenHash: 'different_stored_hash',
      } as unknown as UserDocument;

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: userId.toString(),
        type: 'refresh',
      });
      mockUsersService.findByIdWithRefreshToken.mockResolvedValue(userMock);

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(
        AppException,
      );

      try {
        await service.refresh(rawRefreshToken);
      } catch (err: unknown) {
        const appErr = err as AppException;
        expect(appErr.code).toBe(ErrorCode.INVALID_REFRESH_TOKEN);
        expect(appErr.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should reject when refresh token signature is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('jwt signature invalid'),
      );

      await expect(service.refresh('invalid_token')).rejects.toThrow(
        AppException,
      );
    });
  });
});
