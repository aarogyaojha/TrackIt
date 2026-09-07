import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PlanTier } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { ApiErrorResponse, SubscriptionSummaryResponse } from './types';

export interface ChangeOrgTierVariables {
  id: string;
  planTier: PlanTier;
}

export function useChangeOrgTier(defaultId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SubscriptionSummaryResponse,
    AxiosError<ApiErrorResponse>,
    { id?: string; planTier: PlanTier }
  >({
    mutationFn: async ({ id, planTier }) => {
      const targetId = id || defaultId;
      if (!targetId) {
        throw new Error('Organization ID is required to change tier');
      }
      const response = await apiClient.patch(
        `/organizations/${targetId}/subscription`,
        { planTier },
      );
      return response.data?.data;
    },
    onSuccess: (data, variables) => {
      const targetId = variables.id || defaultId;
      if (targetId) {
        queryClient.invalidateQueries({
          queryKey: superadminKeys.organizationSubscription(targetId),
        });
      }
    },
  });
}
