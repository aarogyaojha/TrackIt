import { useQuery } from '@tanstack/react-query';
import { RoleResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { roleKeys } from './role-keys';

export function useRoles() {
  return useQuery<RoleResponse[]>({
    queryKey: roleKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: RoleResponse[];
      }>('/roles');
      return response.data.data;
    },
  });
}
