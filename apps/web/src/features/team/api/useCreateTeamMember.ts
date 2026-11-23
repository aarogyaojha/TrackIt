import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateStaffPayload, UserResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { teamKeys } from './team-keys';
import { subscriptionKeys } from '@/features/subscription/api/subscription-keys';

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, CreateStaffPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<{
        success: boolean;
        data: UserResponse;
      }>('/users', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
