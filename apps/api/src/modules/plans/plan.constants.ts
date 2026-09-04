import { PlanLimits, PlanTier } from '@trackit/types';

export const DEFAULT_PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    maxActiveTickets: 10,
    maxStaffUsers: 2,
    maxTicketsPerMonth: 30,
  },
  [PlanTier.BASIC]: {
    maxActiveTickets: 50,
    maxStaffUsers: 5,
    maxTicketsPerMonth: 200,
  },
  [PlanTier.PRO]: {
    maxActiveTickets: 500,
    maxStaffUsers: 25,
    maxTicketsPerMonth: 2000,
  },
};

export const PLANS_SWAGGER = {
  TAG: 'Plans',
  LIST_SUMMARY: 'List all subscription plan tiers',
  LIST_DESCRIPTION:
    'Fetches limits and configurations for all plan tiers (Superadmin only).',
  LIST_OK_DESCRIPTION: 'Plan tiers retrieved successfully.',
  UPDATE_SUMMARY: 'Update plan tier limits',
  UPDATE_DESCRIPTION:
    'Updates resource limits for a specific plan tier (Superadmin only).',
  UPDATE_OK_DESCRIPTION: 'Plan tier limits updated successfully.',
} as const;

export const PLANS_DTO_SWAGGER = {
  MAX_ACTIVE_TICKETS_DESCRIPTION: 'Maximum number of concurrent active tickets',
  MAX_ACTIVE_TICKETS_EXAMPLE: 50,
  MAX_STAFF_USERS_DESCRIPTION:
    'Maximum number of staff users allowed in the organization',
  MAX_STAFF_USERS_EXAMPLE: 5,
  MAX_TICKETS_PER_MONTH_DESCRIPTION:
    'Maximum number of tickets allowed to be created per month',
  MAX_TICKETS_PER_MONTH_EXAMPLE: 200,
} as const;
