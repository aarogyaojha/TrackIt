import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { subscriptionKeys } from './subscription-keys';
import { SubscriptionSummaryResponse } from './types';

export function useSubscriptionUsage() {
  return useQuery<SubscriptionSummaryResponse>({
    queryKey: subscriptionKeys.usage(),
    queryFn: async () => {
      const response = await apiClient.get('/organizations/me/subscription');
      return response.data?.data;
    },
  });
}
