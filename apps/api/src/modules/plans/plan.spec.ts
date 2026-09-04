import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PlanTier } from '@trackit/types';
import { DEFAULT_PLAN_LIMITS } from './plan.constants';
import { PlansRepository } from './plan.repository';
import { PlanDocument } from './plan.schema';
import { PlansService } from './plan.service';

describe('PlansService', () => {
  let service: PlansService;
  let repository: jest.Mocked<PlansRepository>;

  const mockPlanDoc = (
    tier: PlanTier,
    overrides?: Partial<PlanDocument>,
  ): PlanDocument =>
    ({
      _id: new Types.ObjectId(),
      tier,
      limits: { ...DEFAULT_PLAN_LIMITS[tier] },
      updatedAt: new Date(),
      createdAt: new Date(),
      ...overrides,
    }) as unknown as PlanDocument;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PlansRepository>> = {
      findByTier: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: PlansRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repository = module.get(PlansRepository);
  });

  describe('getByTier', () => {
    it('returns existing plan if present in repository', async () => {
      const existingPlan = mockPlanDoc(PlanTier.FREE);
      repository.findByTier.mockResolvedValue(existingPlan);

      const result = await service.getByTier(PlanTier.FREE);

      expect(result).toBe(existingPlan);
      expect(repository.findByTier).toHaveBeenCalledWith(PlanTier.FREE);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates and returns default plan if missing in repository', async () => {
      const newPlan = mockPlanDoc(PlanTier.BASIC);
      repository.findByTier.mockResolvedValue(null);
      repository.create.mockResolvedValue(newPlan);

      const result = await service.getByTier(PlanTier.BASIC);

      expect(result).toBe(newPlan);
      expect(repository.findByTier).toHaveBeenCalledWith(PlanTier.BASIC);
      expect(repository.create).toHaveBeenCalledWith({
        tier: PlanTier.BASIC,
        limits: DEFAULT_PLAN_LIMITS[PlanTier.BASIC],
      });
    });
  });

  describe('listAll', () => {
    it('returns all three tiers (FREE, BASIC, PRO)', async () => {
      const freePlan = mockPlanDoc(PlanTier.FREE);
      const basicPlan = mockPlanDoc(PlanTier.BASIC);
      const proPlan = mockPlanDoc(PlanTier.PRO);

      repository.findByTier
        .mockResolvedValueOnce(freePlan)
        .mockResolvedValueOnce(basicPlan)
        .mockResolvedValueOnce(proPlan);

      const result = await service.listAll();

      expect(result).toEqual([freePlan, basicPlan, proPlan]);
      expect(repository.findByTier).toHaveBeenCalledWith(PlanTier.FREE);
      expect(repository.findByTier).toHaveBeenCalledWith(PlanTier.BASIC);
      expect(repository.findByTier).toHaveBeenCalledWith(PlanTier.PRO);
    });
  });

  describe('updateLimits', () => {
    it('merges partial limits correctly and persists changes', async () => {
      const existingPlan = mockPlanDoc(PlanTier.PRO, {
        limits: {
          maxActiveTickets: 500,
          maxStaffUsers: 25,
          maxTicketsPerMonth: 2000,
        },
      });
      const updatedPlan = mockPlanDoc(PlanTier.PRO, {
        limits: {
          maxActiveTickets: 600,
          maxStaffUsers: 25,
          maxTicketsPerMonth: 2000,
        },
      });

      repository.findByTier.mockResolvedValue(existingPlan);
      repository.updateById.mockResolvedValue(updatedPlan);

      const result = await service.updateLimits(PlanTier.PRO, {
        maxActiveTickets: 600,
      });

      expect(result).toBe(updatedPlan);
      expect(repository.updateById).toHaveBeenCalledWith(
        existingPlan._id.toString(),
        {
          $set: {
            limits: {
              maxActiveTickets: 600,
              maxStaffUsers: 25,
              maxTicketsPerMonth: 2000,
            },
          },
        },
      );
    });
  });
});
