import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PlanTier } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { ApiErrorResponse, Plan, UpdatePlanLimitsPayload } from './types';

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: superadminKeys.plans,
    queryFn: async () => {
      const response = await apiClient.get('/plans');
      return response.data?.data;
    },
  });
}

export function useUpdatePlanLimits(defaultTier?: PlanTier) {
  const queryClient = useQueryClient();

  return useMutation<
    Plan,
    AxiosError<ApiErrorResponse>,
    { tier?: PlanTier; limits: UpdatePlanLimitsPayload['limits'] }
  >({
    mutationFn: async ({ tier, limits }) => {
      const targetTier = tier || defaultTier;
      if (!targetTier) {
        throw new Error('Plan tier is required to update limits');
      }
      const response = await apiClient.patch(`/plans/${targetTier}`, limits);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superadminKeys.plans });
    },
  });
}
