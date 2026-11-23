import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';

export interface OrgCheckInQrResponse {
  checkInUrl: string;
  qrCodeDataUrl: string;
  organizationName: string;
  orgSlug: string;
}

export function useOrgCheckInQr(orgId: string) {
  return useQuery<OrgCheckInQrResponse>({
    queryKey: superadminKeys.organizationQr(orgId),
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${orgId}/check-in-qr`);
      return response.data?.data;
    },
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  });
}

