import { useQuery } from '@tanstack/react-query';
import { OrgStatus } from '@trackit/types';
import { apiClient } from '@/lib/api/client';

export interface OrganizationMeResponse {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  createdAt?: string;
  updatedAt?: string;
}

export function useOrganizationMe() {
  return useQuery<OrganizationMeResponse>({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations/me');
      return response.data?.data;
    },
  });
}
