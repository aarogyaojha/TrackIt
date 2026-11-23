import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateRolePayload, RoleResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { roleKeys } from './role-keys';

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<RoleResponse, Error, CreateRolePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<{
        success: boolean;
        data: RoleResponse;
      }>('/roles', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
