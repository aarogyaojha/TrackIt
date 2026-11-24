import { PlanLimits, PlanTier } from '@trackit/types';
import { DEFAULT_PLAN_LIMITS } from '../plans/plan.constants';

export interface SubscriptionUsage {
  staffUsers: number;
  ticketsThisMonth: number;
  activeTickets: number;
  workflows: number;
}

export interface SubscriptionSummaryResponse {
  planTier: PlanTier;
  limits: PlanLimits;
  usage: SubscriptionUsage;
}

/**
 * Note: toSubscriptionSummaryResponse composes data from multiple sources:
 * the Subscription document, the Plan document (limits), and a live count of User documents.
 * This is unlike pure single-document entity mappers elsewhere in the application.
 */
export function toSubscriptionSummaryResponse(
  summary: SubscriptionSummaryResponse,
): SubscriptionSummaryResponse {
  return {
    planTier: summary.planTier,
    limits: {
      maxActiveTickets: summary.limits.maxActiveTickets,
      maxStaffUsers: summary.limits.maxStaffUsers,
      maxTicketsPerMonth: summary.limits.maxTicketsPerMonth,
      maxWorkflows:
        summary.limits.maxWorkflows ??
        DEFAULT_PLAN_LIMITS[summary.planTier]?.maxWorkflows ??
        1,
    },
    usage: {
      staffUsers: summary.usage.staffUsers,
      ticketsThisMonth: summary.usage.ticketsThisMonth,
      activeTickets: summary.usage.activeTickets,
      workflows: summary.usage.workflows,
    },
  };
}
