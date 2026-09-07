import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { SuperAdminOrganization } from './types';

export function useOrganization(id: string) {
  return useQuery<SuperAdminOrganization>({
    queryKey: superadminKeys.organizationDetail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${id}`);
      return response.data?.data;
    },
    enabled: Boolean(id),
  });
}
