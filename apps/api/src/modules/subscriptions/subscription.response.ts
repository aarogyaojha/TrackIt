import { PlanLimits, PlanTier } from '@trackit/types';

export interface SubscriptionUsage {
  staffUsers: number;
  ticketsThisMonth: number;
  activeTickets: number;
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
    },
    usage: {
      staffUsers: summary.usage.staffUsers,
      ticketsThisMonth: summary.usage.ticketsThisMonth,
      activeTickets: summary.usage.activeTickets,
    },
  };
}
