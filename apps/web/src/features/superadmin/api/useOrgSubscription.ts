import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { SubscriptionSummaryResponse } from './types';

export function useOrgSubscription(id: string) {
  return useQuery<SubscriptionSummaryResponse>({
    queryKey: superadminKeys.organizationSubscription(id),
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${id}/subscription`);
      return response.data?.data;
    },
    enabled: Boolean(id),
  });
}
