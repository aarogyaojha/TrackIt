import { HttpStatus } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { OrgStatus, Role } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../constants';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { UsersService } from '../users/user.service';
import { OrganizationsRepository } from './organization.repository';
import { OrganizationDocument } from './organization.schema';
import { OrganizationsService } from './organization.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let usersService: jest.Mocked<UsersService>;
  let platformSettingsService: jest.Mocked<PlatformSettingsService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  const mockOrgRepository = {
    create: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    findPaginated: jest.fn(),
    updateById: jest.fn(),
  };

  const mockUsersService = {
    createUser: jest.fn(),
  };

  const mockPlatformSettingsService = {
    getSettings: jest.fn(),
  };

  const mockSubscriptionsService = {
    createDefaultSubscription: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationsRepository,
          useValue: mockOrgRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PlatformSettingsService,
          useValue: mockPlatformSettingsService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationsRepository = module.get(OrganizationsRepository);
    usersService = module.get(UsersService);
    platformSettingsService = module.get(PlatformSettingsService);
    subscriptionsService = module.get(SubscriptionsService);
  });


  describe('registerOrganization', () => {
    const dto = {
      orgName: 'Apex Auto Repair',
      adminName: 'John Doe',
      adminEmail: 'admin@apexauto.com',
      adminPassword: 'Password123!',
    };

    it('should successfully register org and admin with correct linkage in a transaction', async () => {
      const orgId = new Types.ObjectId();
      const mockOrg = {
        _id: orgId,
        name: 'Apex Auto Repair',
        slug: 'apex-auto-repair',
        status: OrgStatus.PENDING,
      } as unknown as OrganizationDocument;

      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'admin@apexauto.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      };

      platformSettingsService.getSettings.mockResolvedValue({
        requireOrgApproval: true,
      } as unknown as ReturnType<PlatformSettingsService['getSettings']> extends Promise<infer U> ? U : never);

      organizationsRepository.create.mockResolvedValue(mockOrg);
      usersService.createUser.mockResolvedValue(
        mockUser as unknown as ReturnType<UsersService['createUser']> extends Promise<infer U> ? U : never,
      );

      const result = await service.registerOrganization(dto);

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(organizationsRepository.create).toHaveBeenCalledWith(
        {
          name: 'Apex Auto Repair',
          slug: 'apex-auto-repair',
          status: OrgStatus.PENDING,
        },
        { session: mockSession },
      );
      expect(usersService.createUser).toHaveBeenCalledWith(
        {
          email: 'admin@apexauto.com',
          name: 'John Doe',
          password: 'Password123!',
          role: Role.ORG_ADMIN,
          organizationId: orgId,
        },
        mockSession,
      );
      expect(
        subscriptionsService.createDefaultSubscription,
      ).toHaveBeenCalledWith(orgId, mockSession);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual({ organization: mockOrg, user: mockUser });
    });


    it('should throw EMAIL_ALREADY_EXISTS when user creation fails with duplicate email', async () => {
      platformSettingsService.getSettings.mockResolvedValue({
        requireOrgApproval: true,
      } as unknown as ReturnType<PlatformSettingsService['getSettings']> extends Promise<infer U> ? U : never);

      const mockOrg = {
        _id: new Types.ObjectId(),
        name: 'Apex Auto Repair',
        slug: 'apex-auto-repair',
        status: OrgStatus.PENDING,
      } as unknown as OrganizationDocument;

      organizationsRepository.create.mockResolvedValue(mockOrg);

      const duplicateEmailError = new Error(
        'E11000 duplicate key error collection: trackit.users index: email_1 dup key',
      ) as Error & { code: number; keyPattern: Record<string, number> };
      duplicateEmailError.code = 11000;
      duplicateEmailError.keyPattern = { email: 1 };

      usersService.createUser.mockRejectedValue(duplicateEmailError);

      await expect(service.registerOrganization(dto)).rejects.toThrow(
        AppException,
      );

      try {
        await service.registerOrganization(dto);
      } catch (err: unknown) {
        const appErr = err as AppException;
        expect(appErr.code).toBe(ErrorCode.EMAIL_ALREADY_EXISTS);
        expect(appErr.getStatus()).toBe(HttpStatus.CONFLICT);
      }

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should retry with numeric suffix when slug collision occurs and succeed', async () => {
      platformSettingsService.getSettings.mockResolvedValue({
        requireOrgApproval: false,
      } as unknown as ReturnType<PlatformSettingsService['getSettings']> extends Promise<infer U> ? U : never);

      const duplicateSlugError = new Error(
        'E11000 duplicate key error collection: trackit.organizations index: slug_1 dup key',
      ) as Error & { code: number; keyPattern: Record<string, number> };
      duplicateSlugError.code = 11000;
      duplicateSlugError.keyPattern = { slug: 1 };

      const orgId = new Types.ObjectId();
      const mockOrgSecondAttempt = {
        _id: orgId,
        name: 'Apex Auto Repair',
        slug: 'apex-auto-repair-1',
        status: OrgStatus.ACTIVE,
      } as unknown as OrganizationDocument;

      organizationsRepository.create
        .mockRejectedValueOnce(duplicateSlugError)
        .mockResolvedValueOnce(mockOrgSecondAttempt);

      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'admin@apexauto.com',
        name: 'John Doe',
        role: Role.ORG_ADMIN,
        organizationId: orgId,
      };

      usersService.createUser.mockResolvedValue(
        mockUser as unknown as ReturnType<UsersService['createUser']> extends Promise<infer U> ? U : never,
      );

      const result = await service.registerOrganization(dto);

      expect(organizationsRepository.create).toHaveBeenCalledTimes(2);
      expect(organizationsRepository.create).toHaveBeenNthCalledWith(
        1,
        {
          name: 'Apex Auto Repair',
          slug: 'apex-auto-repair',
          status: OrgStatus.ACTIVE,
        },
        { session: mockSession },
      );
      expect(organizationsRepository.create).toHaveBeenNthCalledWith(
        2,
        {
          name: 'Apex Auto Repair',
          slug: 'apex-auto-repair-1',
          status: OrgStatus.ACTIVE,
        },
        { session: mockSession },
      );
      expect(result.organization.slug).toBe('apex-auto-repair-1');
    });

    it('should abort transaction if user creation throws unexpected error', async () => {
      platformSettingsService.getSettings.mockResolvedValue({
        requireOrgApproval: true,
      } as unknown as ReturnType<PlatformSettingsService['getSettings']> extends Promise<infer U> ? U : never);

      const mockOrg = {
        _id: new Types.ObjectId(),
        name: 'Apex Auto Repair',
        slug: 'apex-auto-repair',
        status: OrgStatus.PENDING,
      } as unknown as OrganizationDocument;

      organizationsRepository.create.mockResolvedValue(mockOrg);
      usersService.createUser.mockRejectedValue(new Error('Unexpected DB failure'));

      await expect(service.registerOrganization(dto)).rejects.toThrow(
        AppException,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('listOrganizations', () => {
    it('should call findPaginated with correct filter and pagination options', async () => {
      const mockItems = [
        {
          _id: 'org-1',
          name: 'Org 1',
          slug: 'org-1',
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument,
      ];
      organizationsRepository.findPaginated.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await service.listOrganizations(
        { page: 2, limit: 10 },
        OrgStatus.ACTIVE,
      );

      expect(organizationsRepository.findPaginated).toHaveBeenCalledWith(
        { status: OrgStatus.ACTIVE },
        { page: 2, limit: 10 },
        { createdAt: -1 },
      );
      expect(result).toEqual({ items: mockItems, total: 1 });
    });
  });

  describe('getByIdForSuperadmin', () => {
    it('should return organization when found', async () => {
      const mockOrg = {
        _id: 'org-123',
        name: 'Org',
      } as unknown as OrganizationDocument;
      organizationsRepository.findById.mockResolvedValue(mockOrg);

      const result = await service.getByIdForSuperadmin('org-123');
      expect(result).toEqual(mockOrg);
    });

    it('should throw NOT_FOUND when organization does not exist', async () => {
      organizationsRepository.findById.mockResolvedValue(null);

      await expect(service.getByIdForSuperadmin('missing-id')).rejects.toThrow(
        AppException,
      );
    });
  });

  describe('Status transitions', () => {
    const orgId = 'org-123';

    describe('approve', () => {
      it('should approve organization when in PENDING status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.PENDING,
        } as unknown as OrganizationDocument);
        organizationsRepository.updateById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);

        const result = await service.approve(orgId);

        expect(organizationsRepository.updateById).toHaveBeenCalledWith(orgId, {
          $set: { status: OrgStatus.ACTIVE },
        });
        expect(result.status).toBe(OrgStatus.ACTIVE);
      });

      it('should throw INVALID_STATUS_TRANSITION when not in PENDING status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);

        await expect(service.approve(orgId)).rejects.toThrow(AppException);
      });
    });

    describe('reject', () => {
      it('should reject organization when in PENDING status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.PENDING,
        } as unknown as OrganizationDocument);
        organizationsRepository.updateById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.REJECTED,
        } as unknown as OrganizationDocument);

        const result = await service.reject(orgId);

        expect(organizationsRepository.updateById).toHaveBeenCalledWith(orgId, {
          $set: { status: OrgStatus.REJECTED },
        });
        expect(result.status).toBe(OrgStatus.REJECTED);
      });

      it('should throw INVALID_STATUS_TRANSITION when not in PENDING status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);

        await expect(service.reject(orgId)).rejects.toThrow(AppException);
      });
    });

    describe('suspend', () => {
      it('should suspend organization when in ACTIVE status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);
        organizationsRepository.updateById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.SUSPENDED,
        } as unknown as OrganizationDocument);

        const result = await service.suspend(orgId);

        expect(organizationsRepository.updateById).toHaveBeenCalledWith(orgId, {
          $set: { status: OrgStatus.SUSPENDED },
        });
        expect(result.status).toBe(OrgStatus.SUSPENDED);
      });

      it('should throw INVALID_STATUS_TRANSITION when not in ACTIVE status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.PENDING,
        } as unknown as OrganizationDocument);

        await expect(service.suspend(orgId)).rejects.toThrow(AppException);
      });
    });

    describe('reactivate', () => {
      it('should reactivate organization when in SUSPENDED status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.SUSPENDED,
        } as unknown as OrganizationDocument);
        organizationsRepository.updateById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);

        const result = await service.reactivate(orgId);

        expect(organizationsRepository.updateById).toHaveBeenCalledWith(orgId, {
          $set: { status: OrgStatus.ACTIVE },
        });
        expect(result.status).toBe(OrgStatus.ACTIVE);
      });

      it('should throw INVALID_STATUS_TRANSITION when not in SUSPENDED status', async () => {
        organizationsRepository.findById.mockResolvedValue({
          _id: orgId,
          status: OrgStatus.ACTIVE,
        } as unknown as OrganizationDocument);

        await expect(service.reactivate(orgId)).rejects.toThrow(AppException);
      });
    });
  });
});
