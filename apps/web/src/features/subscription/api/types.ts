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
