import { OrgStatus, PlanLimits, PlanTier } from '@trackit/types';
import { SubscriptionSummaryResponse } from '@/features/subscription/api/types';

export interface SuperAdminOrganization {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettings {
  requireOrgApproval: boolean;
}

export interface Plan {
  tier: PlanTier;
  limits: PlanLimits;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrganizationsParams {
  page?: number;
  limit?: number;
  status?: OrgStatus;
}

export interface PaginatedOrganizationsResponse {
  data: SuperAdminOrganization[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdatePlanLimitsPayload {
  tier: PlanTier;
  limits: {
    maxActiveTickets?: number;
    maxStaffUsers?: number;
    maxTicketsPerMonth?: number;
  };
}

export interface ChangeOrgTierPayload {
  id: string;
  planTier: PlanTier;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type { SubscriptionSummaryResponse };
