import { PlanLimits, PlanTier } from '@trackit/types';
import { PlanDocument } from './plan.schema';

export interface PlanResponse {
  tier: PlanTier;
  limits: PlanLimits;
  updatedAt?: Date;
}

export function toPlanResponse(plan: PlanDocument): PlanResponse {
  return {
    tier: plan.tier,
    limits: {
      maxActiveTickets: plan.limits.maxActiveTickets,
      maxStaffUsers: plan.limits.maxStaffUsers,
      maxTicketsPerMonth: plan.limits.maxTicketsPerMonth,
      maxWorkflows: plan.limits.maxWorkflows,
    },
    updatedAt: plan.updatedAt,
  };
}
