import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api/public-client';

export interface PublicOrgInfoData {
  organizationName: string;
  orgSlug: string;
}

export function usePublicOrgInfo(orgSlug: string) {
  return useQuery<PublicOrgInfoData>({
    queryKey: ['public-org-info', orgSlug],
    queryFn: async () => {
      const response = await publicApi.get<{
        success: boolean;
        data: PublicOrgInfoData;
      }>(`/public/${encodeURIComponent(orgSlug)}/info`);
      return response.data.data;
    },
    enabled: Boolean(orgSlug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

