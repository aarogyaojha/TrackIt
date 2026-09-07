import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { ListOrganizationsParams, PaginatedOrganizationsResponse } from './types';

export function useOrganizationsList(params: ListOrganizationsParams) {
  return useQuery<PaginatedOrganizationsResponse>({
    queryKey: superadminKeys.organizationList(params),
    queryFn: async () => {
      const response = await apiClient.get('/organizations', {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status,
        },
      });
      return response.data;
    },
  });
}
