import { ListOrganizationsParams } from './types';

export const superadminKeys = {
  all: ['superadmin'] as const,
  organizations: ['superadmin', 'organizations'] as const,
  organizationList: (params: ListOrganizationsParams) =>
    ['superadmin', 'organizations', 'list', params] as const,
  organizationDetail: (id: string) =>
    ['superadmin', 'organizations', 'detail', id] as const,
  organizationSubscription: (id: string) =>
    ['superadmin', 'organizations', 'subscription', id] as const,
  platformSettings: ['superadmin', 'platform-settings'] as const,
  plans: ['superadmin', 'plans'] as const,
};
