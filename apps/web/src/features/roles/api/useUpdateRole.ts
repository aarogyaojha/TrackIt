import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RoleResponse, UpdateRolePayload } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { roleKeys } from './role-keys';

interface UpdateRoleVariables {
  id: string;
  payload: UpdateRolePayload;
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<RoleResponse, Error, UpdateRoleVariables>({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.patch<{
        success: boolean;
        data: RoleResponse;
      }>(`/roles/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
