import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientSession, Types } from 'mongoose';
import { PlanTier } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../constants';
import { PlansService } from '../plans/plan.service';
import { PlanDocument } from '../plans/plan.schema';
import { UsersRepository } from '../users/user.repository';
import { SubscriptionsRepository } from './subscription.repository';
import { SubscriptionDocument } from './subscription.schema';
import { SubscriptionsService } from './subscription.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionsRepository: jest.Mocked<SubscriptionsRepository>;
  let plansService: jest.Mocked<PlansService>;
  let usersRepository: jest.Mocked<UsersRepository>;

  const mockOrgId = new Types.ObjectId();

  const mockPlanDoc = (
    tier: PlanTier,
    limits = {
      maxActiveTickets: 10,
      maxStaffUsers: 2,
      maxTicketsPerMonth: 30,
    },
  ): PlanDocument =>
    ({
      _id: new Types.ObjectId(),
      tier,
      limits,
      updatedAt: new Date(),
      createdAt: new Date(),
    }) as unknown as PlanDocument;

  const mockSubscriptionDoc = (
    overrides?: Partial<SubscriptionDocument>,
  ): SubscriptionDocument =>
    ({
      _id: new Types.ObjectId(),
      organizationId: mockOrgId,
      planTier: PlanTier.FREE,
      ticketsThisMonth: 5,
      currentPeriodStart: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as unknown as SubscriptionDocument;

  beforeEach(async () => {
    const mockSubRepo: Partial<jest.Mocked<SubscriptionsRepository>> = {
      create: jest.fn(),
      findByOrganizationId: jest.fn(),
      updateById: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
    };

    const mockPlansSvc: Partial<jest.Mocked<PlansService>> = {
      getByTier: jest.fn(),
    };

    const mockUsersRepo: Partial<jest.Mocked<UsersRepository>> = {
      countByOrganizationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: SubscriptionsRepository,
          useValue: mockSubRepo,
        },
        {
          provide: PlansService,
          useValue: mockPlansSvc,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionsRepository = module.get(SubscriptionsRepository);
    plansService = module.get(PlansService);
    usersRepository = module.get(UsersRepository);
  });

  describe('createDefaultSubscription', () => {
    it('creates a FREE tier subscription within the passed session', async () => {
      const fakeSession = {} as ClientSession;
      const expectedDoc = mockSubscriptionDoc({ planTier: PlanTier.FREE });
      subscriptionsRepository.create.mockResolvedValue(expectedDoc);

      const result = await service.createDefaultSubscription(
        mockOrgId,
        fakeSession,
      );

      expect(result).toBe(expectedDoc);
      expect(subscriptionsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          planTier: PlanTier.FREE,
          ticketsThisMonth: 0,
        }),
        { session: fakeSession },
      );
    });
  });

  describe('getUsageSummary', () => {
    it('merges subscription data, plan limits, and live user count correctly', async () => {
      const subscription = mockSubscriptionDoc({
        planTier: PlanTier.BASIC,
        ticketsThisMonth: 12,
      });

      const planDoc = mockPlanDoc(PlanTier.BASIC, {
        maxActiveTickets: 50,
        maxStaffUsers: 5,
        maxTicketsPerMonth: 200,
      });

      subscriptionsRepository.findByOrganizationId.mockResolvedValue(
        subscription,
      );
      plansService.getByTier.mockResolvedValue(planDoc);
      usersRepository.countByOrganizationId.mockResolvedValue(3);

      const result = await service.getUsageSummary(mockOrgId);

      expect(result).toEqual({
        planTier: PlanTier.BASIC,
        limits: {
          maxActiveTickets: 50,
          maxStaffUsers: 5,
          maxTicketsPerMonth: 200,
        },
        usage: {
          staffUsers: 3,
          ticketsThisMonth: 12,
          activeTickets: 0,
        },
      });

      expect(subscriptionsRepository.findByOrganizationId).toHaveBeenCalledWith(
        mockOrgId,
      );
      expect(plansService.getByTier).toHaveBeenCalledWith(PlanTier.BASIC);
      expect(usersRepository.countByOrganizationId).toHaveBeenCalledWith(
        mockOrgId,
      );
    });
  });

  describe('assertPlanLimit', () => {
    it('throws PLAN_LIMIT_EXCEEDED with 409 status when usage is at limit', async () => {
      const subscription = mockSubscriptionDoc({ planTier: PlanTier.FREE });
      const planDoc = mockPlanDoc(PlanTier.FREE, {
        maxActiveTickets: 10,
        maxStaffUsers: 2,
        maxTicketsPerMonth: 30,
      });

      subscriptionsRepository.findByOrganizationId.mockResolvedValue(
        subscription,
      );
      plansService.getByTier.mockResolvedValue(planDoc);

      await expect(
        service.assertPlanLimit(mockOrgId, 'maxStaffUsers', 2),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_LIMIT_EXCEEDED,
          }),
        }),
      );
    });

    it('throws PLAN_LIMIT_EXCEEDED with 409 status when usage is over limit', async () => {
      const subscription = mockSubscriptionDoc({ planTier: PlanTier.FREE });
      const planDoc = mockPlanDoc(PlanTier.FREE, {
        maxActiveTickets: 10,
        maxStaffUsers: 2,
        maxTicketsPerMonth: 30,
      });

      subscriptionsRepository.findByOrganizationId.mockResolvedValue(
        subscription,
      );
      plansService.getByTier.mockResolvedValue(planDoc);

      await expect(
        service.assertPlanLimit(mockOrgId, 'maxActiveTickets', 15),
      ).rejects.toThrow(AppException);
    });

    it('passes silently when usage is strictly under the limit', async () => {
      const subscription = mockSubscriptionDoc({ planTier: PlanTier.FREE });
      const planDoc = mockPlanDoc(PlanTier.FREE, {
        maxActiveTickets: 10,
        maxStaffUsers: 2,
        maxTicketsPerMonth: 30,
      });

      subscriptionsRepository.findByOrganizationId.mockResolvedValue(
        subscription,
      );
      plansService.getByTier.mockResolvedValue(planDoc);

      await expect(
        service.assertPlanLimit(mockOrgId, 'maxActiveTickets', 9),
      ).resolves.toBeUndefined();
    });
  });


  describe('resetMonthlyUsageCounters', () => {
    it('calls updateMany with the right filter and update shape to reset counters', async () => {
      subscriptionsRepository.updateMany.mockResolvedValue({
        matchedCount: 5,
        modifiedCount: 5,
      });

      const result = await service.resetMonthlyUsageCounters();

      expect(result).toEqual({ matchedCount: 5, modifiedCount: 5 });
      expect(subscriptionsRepository.updateMany).toHaveBeenCalledWith(
        {},
        {
          $set: {
            ticketsThisMonth: 0,
            currentPeriodStart: expect.any(Date),
          },
        },
      );
    });
  });

  describe('incrementTicketsThisMonth', () => {
    it('calls updateOne with $inc ticketsThisMonth by 1 for string orgId', async () => {
      subscriptionsRepository.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await service.incrementTicketsThisMonth(mockOrgId.toString());

      expect(subscriptionsRepository.updateOne).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        { $inc: { ticketsThisMonth: 1 } },
      );
    });

    it('calls updateOne with $inc ticketsThisMonth by 1 for ObjectId orgId', async () => {
      subscriptionsRepository.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await service.incrementTicketsThisMonth(mockOrgId);

      expect(subscriptionsRepository.updateOne).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        { $inc: { ticketsThisMonth: 1 } },
      );
    });
  });

  describe('changeTier', () => {
    it('updates plan tier and returns updated subscription', async () => {
      const existing = mockSubscriptionDoc({ planTier: PlanTier.FREE });
      const updated = mockSubscriptionDoc({ planTier: PlanTier.PRO });

      subscriptionsRepository.findByOrganizationId.mockResolvedValue(existing);
      subscriptionsRepository.updateById.mockResolvedValue(updated);

      const result = await service.changeTier(mockOrgId, PlanTier.PRO);

      expect(result).toBe(updated);
      expect(subscriptionsRepository.updateById).toHaveBeenCalledWith(
        existing._id.toString(),
        {
          $set: { planTier: PlanTier.PRO },
        },
      );
    });
  });
});
