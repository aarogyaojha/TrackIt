import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { ApiErrorResponse, SuperAdminOrganization } from './types';

export function useReactivateOrg() {
  const queryClient = useQueryClient();

  return useMutation<SuperAdminOrganization, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/organizations/${id}/reactivate`);
      return response.data?.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: superadminKeys.organizations });
      queryClient.invalidateQueries({ queryKey: superadminKeys.organizationDetail(id) });
    },
  });
}
