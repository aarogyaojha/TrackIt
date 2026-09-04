import { Injectable } from '@nestjs/common';
import { PlanLimits, PlanTier } from '@trackit/types';
import { UpdatePlanLimitsDto } from './dto/update-plan-limits.dto';
import { DEFAULT_PLAN_LIMITS } from './plan.constants';
import { PlansRepository } from './plan.repository';
import { PlanDocument } from './plan.schema';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  async getByTier(tier: PlanTier): Promise<PlanDocument> {
    const existing = await this.plansRepository.findByTier(tier);
    if (existing) {
      return existing;
    }

    return this.plansRepository.create({
      tier,
      limits: { ...DEFAULT_PLAN_LIMITS[tier] },
    });
  }

  async listAll(): Promise<PlanDocument[]> {
    const tiers: PlanTier[] = [
      PlanTier.FREE,
      PlanTier.BASIC,
      PlanTier.PRO,
    ];

    return Promise.all(tiers.map((tier) => this.getByTier(tier)));
  }

  async updateLimits(
    tier: PlanTier,
    partialLimits: UpdatePlanLimitsDto | Partial<PlanLimits>,
  ): Promise<PlanDocument> {
    const current = await this.getByTier(tier);
    const updatedLimits: PlanLimits = {
      maxActiveTickets:
        partialLimits.maxActiveTickets ?? current.limits.maxActiveTickets,
      maxStaffUsers:
        partialLimits.maxStaffUsers ?? current.limits.maxStaffUsers,
      maxTicketsPerMonth:
        partialLimits.maxTicketsPerMonth ?? current.limits.maxTicketsPerMonth,
    };

    const updated = await this.plansRepository.updateById(
      current._id.toString(),
      {
        $set: { limits: updatedLimits },
      },
    );

    return updated || current;
  }
}
