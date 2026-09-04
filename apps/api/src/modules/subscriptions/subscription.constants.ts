import { PlanTier } from '@trackit/types';

export const SUBSCRIPTIONS_SWAGGER = {
  TAG: 'Subscriptions',
  GET_ORG_SUMMARY: 'Get organization subscription and usage summary',
  GET_ORG_DESCRIPTION:
    'Fetches current plan tier, limits, and live usage counters for a specific organization (Superadmin only).',
  GET_ORG_OK_DESCRIPTION:
    'Subscription and usage summary retrieved successfully.',
  CHANGE_TIER_SUMMARY: 'Change organization subscription tier',
  CHANGE_TIER_DESCRIPTION:
    'Updates an organization subscription tier immediately (Superadmin only).',
  CHANGE_TIER_OK_DESCRIPTION: 'Subscription tier updated successfully.',
  GET_ME_SUMMARY: 'Get own organization subscription and usage summary',
  GET_ME_DESCRIPTION:
    'Fetches current plan tier, limits, and live usage counters for the authenticated tenant organization.',
  GET_ME_OK_DESCRIPTION:
    'Subscription and usage summary retrieved successfully.',
} as const;

export const SUBSCRIPTION_DTO_SWAGGER = {
  PLAN_TIER_DESCRIPTION: 'New subscription plan tier',
  PLAN_TIER_EXAMPLE: PlanTier.PRO,
} as const;
