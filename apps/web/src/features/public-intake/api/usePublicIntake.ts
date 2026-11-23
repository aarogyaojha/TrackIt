import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api/public-client';

export interface PublicIntakeWorkflow {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface PublicIntakeData {
  organizationName: string;
  orgSlug: string;
  workflows: PublicIntakeWorkflow[];
}

export function usePublicIntake(orgSlug: string) {
  return useQuery<PublicIntakeData>({
    queryKey: ['public-intake', orgSlug],
    queryFn: async () => {
      const response = await publicApi.get<{
        success: boolean;
        data: PublicIntakeData;
      }>(`/public/${encodeURIComponent(orgSlug)}/intake`);
      return response.data.data;
    },
    enabled: Boolean(orgSlug),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

