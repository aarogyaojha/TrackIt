import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { OrgStatus, TicketStatus } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../constants';
import { OrganizationDocument } from '../organizations/organization.schema';
import { OrganizationsService } from '../organizations/organization.service';
import { SubscriptionDocument } from '../subscriptions/subscription.schema';
import { SubscriptionsService } from '../subscriptions/subscription.service';
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

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<TicketsRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findPaginated: jest.fn(),
      updateById: jest.fn(),
      countActiveByOrganization: jest.fn(),
      findByOrgAndCode: jest.fn(),
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
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketsRepository = module.get(TicketsRepository);
    organizationsService = module.get(OrganizationsService);
    subscriptionsService = module.get(SubscriptionsService);
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
});
