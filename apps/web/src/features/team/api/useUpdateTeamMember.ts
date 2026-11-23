import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateStaffPayload, UserResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { teamKeys } from './team-keys';

interface UpdateTeamMemberVariables {
  id: string;
  payload: UpdateStaffPayload;
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UpdateTeamMemberVariables>({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.patch<{
        success: boolean;
        data: UserResponse;
      }>(`/users/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}
