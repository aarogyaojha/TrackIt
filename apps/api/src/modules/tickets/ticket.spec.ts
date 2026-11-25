import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { OrgStatus, StatusCategory, TicketStatus } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { OrganizationDocument } from '../organizations/organization.schema';
import { OrganizationsService } from '../organizations/organization.service';
import { SubscriptionDocument } from '../subscriptions/subscription.schema';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { WorkflowDocument } from '../workflows/workflow.schema';
import { WorkflowsService } from '../workflows/workflow.service';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/user.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TicketsRepository } from './ticket.repository';
import { TicketDocument } from './ticket.schema';
import { TicketsService } from './ticket.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketsRepository: jest.Mocked<TicketsRepository>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let usersService: jest.Mocked<UsersService>;

  const mockOrgId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();
  const mockTicketId = new Types.ObjectId();

  const mockTicketDoc = (
    overrides?: Partial<TicketDocument>,
  ): TicketDocument =>
    ({
      _id: mockTicketId,
      organizationId: mockOrgId,
      code: 'BIKE-100',
      customerName: 'John Doe',
      customerPhone: '555-0199',
      itemDescription: 'Mountain Bike',
      status: TicketStatus.RECEIVED,
      statusHistory: [
        {
          status: TicketStatus.RECEIVED,
          changedAt: new Date(),
          changedBy: mockUserId,
        },
      ],
      createdBy: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as unknown as TicketDocument;

  const mockSubscription = {
    _id: new Types.ObjectId(),
    organizationId: mockOrgId,
    ticketsThisMonth: 5,
  } as unknown as SubscriptionDocument;

  const mockOrg = {
    _id: mockOrgId,
    name: 'Apex Bike Shop',
    slug: 'apex-bikes',
    status: OrgStatus.ACTIVE,
  } as unknown as OrganizationDocument;

  const mockDefaultWorkflow = {
    _id: new Types.ObjectId(),
    name: 'Default Workflow',
    isDefault: true,
    statuses: [
      { key: TicketStatus.RECEIVED, name: 'Received', category: StatusCategory.INITIAL, order: 0 },
      { key: TicketStatus.IN_PROGRESS, name: 'In Progress', category: StatusCategory.IN_PROGRESS, order: 1 },
      { key: TicketStatus.READY, name: 'Ready', category: StatusCategory.READY, order: 2 },
      { key: TicketStatus.DELIVERED, name: 'Delivered', category: StatusCategory.COMPLETED, order: 3 },
      { key: TicketStatus.CANCELLED, name: 'Cancelled', category: StatusCategory.CANCELLED, order: 4 },
    ],
  };

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<TicketsRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findPaginated: jest.fn(),
      updateById: jest.fn(),
      countActiveByOrganization: jest.fn(),
      findByOrgAndCode: jest.fn(),
      findByOrgAndPhone: jest.fn(),
      getDashboardStatsRaw: jest.fn(),
    };

    const mockOrgsSvc: Partial<jest.Mocked<OrganizationsService>> = {
      getById: jest.fn(),
      getBySlug: jest.fn(),
    };

    const mockSubsSvc: Partial<jest.Mocked<SubscriptionsService>> = {
      getByOrganizationId: jest.fn(),
      assertPlanLimit: jest.fn(),
      incrementTicketsThisMonth: jest.fn(),
    };

    const mockWfSvc: Partial<jest.Mocked<WorkflowsService>> = {
      getDefaultWorkflow: jest
        .fn()
        .mockResolvedValue(mockDefaultWorkflow as unknown as WorkflowDocument),
      getByIdScoped: jest
        .fn()
        .mockResolvedValue(mockDefaultWorkflow as unknown as WorkflowDocument),
      listByOrg: jest
        .fn()
        .mockResolvedValue([{ ...mockDefaultWorkflow, isActive: true } as unknown as WorkflowDocument]),
    };

    const mockUsersSvc: Partial<jest.Mocked<UsersService>> = {
      listStaffByOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: TicketsRepository,
          useValue: mockRepo,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrgsSvc,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubsSvc,
        },
        {
          provide: WorkflowsService,
          useValue: mockWfSvc,
        },
        {
          provide: UsersService,
          useValue: mockUsersSvc,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketsRepository = module.get(TicketsRepository);
    organizationsService = module.get(OrganizationsService);
    subscriptionsService = module.get(SubscriptionsService);
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    const createDto: CreateTicketDto = {
      code: 'bike-100',
      customerName: '  John Doe  ',
      customerPhone: '  555-0199  ',
      itemDescription: '  Mountain Bike  ',
    };

    it('successfully creates a ticket, uppercases code, trims fields, and increments monthly counter', async () => {
      const createdTicket = mockTicketDoc({ code: 'BIKE-100' });

      subscriptionsService.getByOrganizationId.mockResolvedValue(
        mockSubscription,
      );
      subscriptionsService.assertPlanLimit.mockResolvedValue(undefined);
      ticketsRepository.countActiveByOrganization.mockResolvedValue(2);
      ticketsRepository.create.mockResolvedValue(createdTicket);
      subscriptionsService.incrementTicketsThisMonth.mockResolvedValue(
        undefined,
      );

      const result = await service.create(mockOrgId, mockUserId, createDto);

      expect(result).toBe(createdTicket);
      expect(subscriptionsService.getByOrganizationId).toHaveBeenCalledWith(
        mockOrgId,
      );
      expect(subscriptionsService.assertPlanLimit).toHaveBeenCalledWith(
        mockOrgId,
        'maxTicketsPerMonth',
        5,
      );
      expect(ticketsRepository.countActiveByOrganization).toHaveBeenCalledWith(
        mockOrgId,
      );
      expect(subscriptionsService.assertPlanLimit).toHaveBeenCalledWith(
        mockOrgId,
        'maxActiveTickets',
        2,
      );
      expect(ticketsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          code: 'BIKE-100',
          customerName: 'John Doe',
          customerPhone: '555-0199',
          itemDescription: 'Mountain Bike',
          status: TicketStatus.RECEIVED,
          statusHistory: [
            expect.objectContaining({
              status: TicketStatus.RECEIVED,
              changedBy: mockUserId,
            }),
          ],
          createdBy: mockUserId,
        }),
      );
      expect(
        subscriptionsService.incrementTicketsThisMonth,
      ).toHaveBeenCalledWith(mockOrgId);
    });

    it('throws TICKET_CODE_TAKEN (409) when compound unique index collision occurs', async () => {
      subscriptionsService.getByOrganizationId.mockResolvedValue(
        mockSubscription,
      );
      subscriptionsService.assertPlanLimit.mockResolvedValue(undefined);
      ticketsRepository.countActiveByOrganization.mockResolvedValue(0);

      const mongoDuplicateError = {
        code: 11000,
        name: 'MongoServerError',
        message: 'E11000 duplicate key error collection: trackit.tickets index: organizationId_1_code_1',
      };
      ticketsRepository.create.mockRejectedValue(mongoDuplicateError);

      await expect(
        service.create(mockOrgId, mockUserId, createDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.TICKET_CODE_TAKEN,
          }),
        }),
      );
      expect(
        subscriptionsService.incrementTicketsThisMonth,
      ).not.toHaveBeenCalled();
    });

    it('throws PLAN_LIMIT_EXCEEDED when maxTicketsPerMonth limit is reached', async () => {
      subscriptionsService.getByOrganizationId.mockResolvedValue(
        mockSubscription,
      );
      subscriptionsService.assertPlanLimit.mockImplementation(
        async (_orgId, limitKey) => {
          if (limitKey === 'maxTicketsPerMonth') {
            throw new AppException(
              HttpStatus.CONFLICT,
              ErrorCode.PLAN_LIMIT_EXCEEDED,
              'Plan limit exceeded',
            );
          }
        },
      );

      await expect(
        service.create(mockOrgId, mockUserId, createDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_LIMIT_EXCEEDED,
          }),
        }),
      );
      expect(ticketsRepository.create).not.toHaveBeenCalled();
    });

    it('throws PLAN_LIMIT_EXCEEDED when maxActiveTickets limit is reached', async () => {
      subscriptionsService.getByOrganizationId.mockResolvedValue(
        mockSubscription,
      );
      ticketsRepository.countActiveByOrganization.mockResolvedValue(10);
      subscriptionsService.assertPlanLimit.mockImplementation(
        async (_orgId, limitKey) => {
          if (limitKey === 'maxActiveTickets') {
            throw new AppException(
              HttpStatus.CONFLICT,
              ErrorCode.PLAN_LIMIT_EXCEEDED,
              'Plan limit exceeded',
            );
          }
        },
      );

      await expect(
        service.create(mockOrgId, mockUserId, createDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_LIMIT_EXCEEDED,
          }),
        }),
      );
      expect(ticketsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('listByOrg', () => {
    it('returns paginated tickets with optional filters', async () => {
      const tickets = [mockTicketDoc()];
      ticketsRepository.findPaginated.mockResolvedValue({
        items: tickets,
        total: 1,
      });

      const query: ListTicketsQueryDto = {
        page: 1,
        limit: 10,
        status: TicketStatus.RECEIVED,
        search: 'bike',
      };

      const result = await service.listByOrg(mockOrgId, query);

      expect(result).toEqual({ items: tickets, total: 1 });
      expect(ticketsRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          status: TicketStatus.RECEIVED,
          $or: [
            { code: expect.any(RegExp) },
            { customerName: expect.any(RegExp) },
          ],
        }),
        { page: 1, limit: 10 },
        { createdAt: -1 },
      );
    });

    it('escapes regex metacharacters in search query to prevent ReDoS/SyntaxError', async () => {
      ticketsRepository.findPaginated.mockResolvedValue({
        items: [],
        total: 0,
      });

      const query: ListTicketsQueryDto = {
        page: 1,
        limit: 10,
        search: '(a+)+ [invalid',
      };

      await service.listByOrg(mockOrgId, query);

      const filterArg = ticketsRepository.findPaginated.mock.calls[0][0] as {
        $or: Array<{ code: RegExp; customerName?: RegExp }>;
      };
      expect(filterArg.$or[0].code.source).toBe('\\(a\\+\\)\\+ \\[invalid');
    });
  });

  describe('getByIdScoped', () => {
    it('returns ticket if found within the same organization', async () => {
      const ticket = mockTicketDoc();
      ticketsRepository.findById.mockResolvedValue(ticket);

      const result = await service.getByIdScoped(
        mockOrgId,
        mockTicketId.toString(),
      );

      expect(result).toBe(ticket);
    });

    it('throws NOT_FOUND (404, not 403) when ticket does not exist', async () => {
      ticketsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getByIdScoped(mockOrgId, mockTicketId.toString()),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        }),
      );
    });

    it('throws NOT_FOUND (404, not FORBIDDEN 403) when ticket belongs to a different organization', async () => {
      const otherOrgId = new Types.ObjectId();
      const ticket = mockTicketDoc({ organizationId: otherOrgId });
      ticketsRepository.findById.mockResolvedValue(ticket);

      await expect(
        service.getByIdScoped(mockOrgId, mockTicketId.toString()),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    // Test every valid transition in the map
    const validTransitions: Array<[TicketStatus, TicketStatus]> = [
      [TicketStatus.RECEIVED, TicketStatus.IN_PROGRESS],
      [TicketStatus.RECEIVED, TicketStatus.CANCELLED],
      [TicketStatus.IN_PROGRESS, TicketStatus.READY],
      [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
      [TicketStatus.READY, TicketStatus.DELIVERED],
      [TicketStatus.READY, TicketStatus.CANCELLED],
    ];

    test.each(validTransitions)(
      'allows valid transition from %s to %s',
      async (fromStatus, toStatus) => {
        const ticket = mockTicketDoc({ status: fromStatus });
        const updatedTicket = mockTicketDoc({ status: toStatus });

        ticketsRepository.findById.mockResolvedValue(ticket);
        ticketsRepository.updateById.mockResolvedValue(updatedTicket);

        const result = await service.updateStatus(
          mockOrgId,
          mockTicketId.toString(),
          mockUserId,
          toStatus,
        );

        expect(result).toBe(updatedTicket);
        expect(ticketsRepository.updateById).toHaveBeenCalledWith(
          ticket._id.toString(),
          {
            $set: { status: toStatus },
            $push: {
              statusHistory: {
                status: toStatus,
                changedAt: expect.any(Date),
                changedBy: mockUserId,
              },
            },
          },
        );
      },
    );

    // Test at least one invalid transition per state
    const invalidTransitions: Array<[TicketStatus, TicketStatus]> = [
      [TicketStatus.RECEIVED, TicketStatus.READY],
      [TicketStatus.RECEIVED, TicketStatus.DELIVERED],
      [TicketStatus.IN_PROGRESS, TicketStatus.DELIVERED],
      [TicketStatus.IN_PROGRESS, TicketStatus.RECEIVED],
      [TicketStatus.READY, TicketStatus.IN_PROGRESS],
      [TicketStatus.READY, TicketStatus.RECEIVED],
      [TicketStatus.DELIVERED, TicketStatus.IN_PROGRESS],
      [TicketStatus.DELIVERED, TicketStatus.READY],
      [TicketStatus.CANCELLED, TicketStatus.RECEIVED],
      [TicketStatus.CANCELLED, TicketStatus.IN_PROGRESS],
    ];

    test.each(invalidTransitions)(
      'rejects invalid transition from %s to %s with 409 INVALID_STATUS_TRANSITION',
      async (fromStatus, toStatus) => {
        const ticket = mockTicketDoc({ status: fromStatus });
        ticketsRepository.findById.mockResolvedValue(ticket);

        await expect(
          service.updateStatus(
            mockOrgId,
            mockTicketId.toString(),
            mockUserId,
            toStatus,
          ),
        ).rejects.toThrow(
          expect.objectContaining({
            status: HttpStatus.CONFLICT,
            response: expect.objectContaining({
              code: ErrorCode.INVALID_STATUS_TRANSITION,
            }),
          }),
        );
      },
    );
  });

  describe('getPublicByOrgSlugAndCode', () => {
    it('returns public ticket and organization name when org is active and ticket exists', async () => {
      const ticket = mockTicketDoc();
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(ticket);

      const result = await service.getPublicByOrgSlugAndCode(
        'apex-bikes',
        'BIKE-100',
      );

      expect(result).toEqual({
        ticket,
        orgName: 'Apex Bike Shop',
        workflow: mockDefaultWorkflow,
      });
      expect(organizationsService.getBySlug).toHaveBeenCalledWith('apex-bikes');
      expect(ticketsRepository.findByOrgAndCode).toHaveBeenCalledWith(
        mockOrgId,
        'BIKE-100',
      );
    });

    it('throws NOT_FOUND if organization does not exist', async () => {
      organizationsService.getBySlug.mockResolvedValue(null);

      await expect(
        service.getPublicByOrgSlugAndCode('non-existent', 'BIKE-100'),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        }),
      );
    });

    it('throws NOT_FOUND if organization is not ACTIVE (e.g. SUSPENDED or PENDING)', async () => {
      const suspendedOrg = {
        ...mockOrg,
        status: OrgStatus.SUSPENDED,
      } as OrganizationDocument;
      organizationsService.getBySlug.mockResolvedValue(suspendedOrg);

      await expect(
        service.getPublicByOrgSlugAndCode('apex-bikes', 'BIKE-100'),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        }),
      );
    });

    it('throws NOT_FOUND if ticket code does not exist in the organization', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(null);

      await expect(
        service.getPublicByOrgSlugAndCode('apex-bikes', 'NOT-FOUND'),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        }),
      );
    });
  });

  describe('getPublicIntakeInfo', () => {
    it('returns organization public intake info and active workflows', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);

      const result = await service.getPublicIntakeInfo('apex-bikes');

      expect(result).toEqual({
        organizationName: 'Apex Bike Shop',
        orgSlug: 'apex-bikes',
        workflows: [
          expect.objectContaining({
            name: 'Default Workflow',
            isDefault: true,
          }),
        ],
      });
    });

    it('throws NOT_FOUND if org does not exist or is suspended', async () => {
      organizationsService.getBySlug.mockResolvedValue(null);

      await expect(service.getPublicIntakeInfo('unknown')).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
          response: expect.objectContaining({ code: ErrorCode.NOT_FOUND }),
        }),
      );
    });
  });

  describe('createPublicTicket', () => {
    const publicDto = {
      customerName: 'Jane Public',
      customerPhone: '+15551234567',
      itemDescription: 'Chain slipping in 4th gear',
    };

    it('successfully creates a ticket through public intake with an auto-generated code', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      subscriptionsService.getByOrganizationId.mockResolvedValue(mockSubscription);
      ticketsRepository.countActiveByOrganization.mockResolvedValue(2);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(null);
      ticketsRepository.create.mockResolvedValue(
        mockTicketDoc({
          code: 'TK-A2B3C4',
          customerName: publicDto.customerName,
          customerPhone: publicDto.customerPhone,
          itemDescription: publicDto.itemDescription,
          createdBy: undefined,
        }),
      );

      const result = await service.createPublicTicket('apex-bikes', publicDto);

      expect(result.orgName).toBe('Apex Bike Shop');
      expect(result.ticket.code).toBe('TK-A2B3C4');
      expect(subscriptionsService.incrementTicketsThisMonth).toHaveBeenCalledWith(mockOrgId);
      expect(ticketsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          customerName: 'Jane Public',
          customerPhone: '+15551234567',
          itemDescription: 'Chain slipping in 4th gear',
        }),
      );
    });

    it('recovers from collision when candidate code already exists', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      subscriptionsService.getByOrganizationId.mockResolvedValue(mockSubscription);
      ticketsRepository.countActiveByOrganization.mockResolvedValue(1);

      // First code exists, second code is unique
      ticketsRepository.findByOrgAndCode
        .mockResolvedValueOnce(mockTicketDoc())
        .mockResolvedValueOnce(null);

      ticketsRepository.create.mockResolvedValue(
        mockTicketDoc({
          code: 'TK-UNIQUE',
          customerName: publicDto.customerName,
        }),
      );

      const result = await service.createPublicTicket('apex-bikes', publicDto);

      expect(result.ticket.code).toBe('TK-UNIQUE');
      expect(ticketsRepository.create).toHaveBeenCalled();
    });

    it('asserts plan limits and throws 409 if active tickets limit is exceeded', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      subscriptionsService.getByOrganizationId.mockResolvedValue(mockSubscription);
      ticketsRepository.countActiveByOrganization.mockResolvedValue(10);
      subscriptionsService.assertPlanLimit.mockImplementation(
        (_orgId, limitKey, current) => {
          if (limitKey === 'maxActiveTickets' && current >= 10) {
            throw new AppException(
              HttpStatus.CONFLICT,
              ErrorCode.PLAN_LIMIT_EXCEEDED,
              ErrorMessages[ErrorCode.PLAN_LIMIT_EXCEEDED],
            );
          }
          return Promise.resolve();
        },
      );

      await expect(
        service.createPublicTicket('apex-bikes', publicDto),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_LIMIT_EXCEEDED,
          }),
        }),
      );
    });
  });

  describe('getPublicOrgInfo', () => {
    it('returns organization name and slug for active organization', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);

      const result = await service.getPublicOrgInfo('apex-bikes');

      expect(result).toEqual({
        organizationName: 'Apex Bike Shop',
        orgSlug: 'apex-bikes',
      });
    });

    it('throws 404 NOT_FOUND if organization is not active or missing', async () => {
      organizationsService.getBySlug.mockResolvedValue(null);

      await expect(service.getPublicOrgInfo('unknown-org')).rejects.toThrow(
        AppException,
      );
    });
  });

  describe('lookupPublic', () => {
    it('finds ticket by exact code', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(
        mockTicketDoc({ code: 'TK-123456' }),
      );

      const result = await service.lookupPublic('apex-bikes', 'TK-123456');

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].ticket.code).toBe('TK-123456');
    });

    it('finds ticket by code without TK- prefix', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTicketDoc({ code: 'TK-123456' }));

      const result = await service.lookupPublic('apex-bikes', '123456');

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].ticket.code).toBe('TK-123456');
    });

    it('finds ticket by customer phone number when not found by code', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(null);
      ticketsRepository.findByOrgAndPhone.mockResolvedValue([
        mockTicketDoc({ code: 'TK-PHONE1', customerPhone: '+15551234567' }),
      ]);

      const result = await service.lookupPublic('apex-bikes', '+15551234567');

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].ticket.code).toBe('TK-PHONE1');
    });

    it('throws 404 NOT_FOUND if no tickets match code or phone', async () => {
      organizationsService.getBySlug.mockResolvedValue(mockOrg);
      ticketsRepository.findByOrgAndCode.mockResolvedValue(null);
      ticketsRepository.findByOrgAndPhone.mockResolvedValue([]);

      await expect(
        service.lookupPublic('apex-bikes', 'nonexistent'),
      ).rejects.toThrow(AppException);
    });
  });

  describe('getDashboardStats', () => {
    it('returns calculated overview, workflow stages, and staff performance', async () => {
      ticketsRepository.getDashboardStatsRaw.mockResolvedValue({
        categoryCounts: [
          { _id: StatusCategory.INITIAL, count: 5 },
          { _id: StatusCategory.IN_PROGRESS, count: 10 },
          { _id: StatusCategory.READY, count: 3 },
          { _id: StatusCategory.COMPLETED, count: 20 },
          { _id: StatusCategory.CANCELLED, count: 2 },
        ],
        workflowStageCounts: [
          {
            _id: {
              workflowId: mockDefaultWorkflow._id,
              status: TicketStatus.RECEIVED,
            },
            count: 5,
          },
          {
            _id: {
              workflowId: mockDefaultWorkflow._id,
              status: TicketStatus.IN_PROGRESS,
            },
            count: 10,
          },
        ],
        createdCounts: [{ _id: mockUserId, count: 15 }],
        updateCounts: [{ _id: mockUserId, count: 30 }],
        completedCounts: [{ _id: mockUserId, count: 20 }],
        recentTickets: [mockTicketDoc({ code: 'TK-RECENT1' })],
      });

      usersService.listStaffByOrganization.mockResolvedValue([
        {
          _id: mockUserId,
          name: 'Staff Alice',
          email: 'alice@example.com',
          role: 'ORG_STAFF',
        } as unknown as UserDocument,
      ]);

      const result = await service.getDashboardStats(
        mockOrgId.toString(),
        mockUserId.toString(),
        true,
      );

      expect(result.overview.totalTickets).toBe(40);
      expect(result.overview.activeTickets).toBe(18); // 5 + 10 + 3
      expect(result.overview.completedTickets).toBe(20);
      expect(result.overview.cancelledTickets).toBe(2);
      expect(result.overview.completionRate).toBe(50); // 20 / 40 * 100

      expect(result.workflows).toHaveLength(1);
      expect(result.workflows[0].stages).toHaveLength(5);

      expect(result.staffPerformance).toHaveLength(1);
      expect(result.staffPerformance[0].name).toBe('Staff Alice');
      expect(result.staffPerformance[0].ticketsCreated).toBe(15);
      expect(result.staffPerformance[0].ticketsCompleted).toBe(20);
      expect(result.staffPerformance[0].totalStatusUpdates).toBe(30);

      expect(result.recentActivity).toHaveLength(1);
      expect(result.recentActivity[0].code).toBe('TK-RECENT1');
    });

    it('omits staff performance details when user lacks USERS_READ permission', async () => {
      ticketsRepository.getDashboardStatsRaw.mockResolvedValue({
        categoryCounts: [{ _id: StatusCategory.COMPLETED, count: 5 }],
        workflowStageCounts: [],
        createdCounts: [{ _id: mockUserId, count: 5 }],
        updateCounts: [{ _id: mockUserId, count: 5 }],
        completedCounts: [{ _id: mockUserId, count: 5 }],
        recentTickets: [],
      });

      const result = await service.getDashboardStats(
        mockOrgId.toString(),
        mockUserId.toString(),
        false,
      );

      expect(result.overview.totalTickets).toBe(5);
      expect(result.staffPerformance).toEqual([]);
      expect(usersService.listStaffByOrganization).not.toHaveBeenCalled();
    });
  });
});
