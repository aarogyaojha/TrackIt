import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CheckInQrResponse {
  checkInUrl: string;
  qrCodeDataUrl: string;
  organizationName: string;
  orgSlug: string;
}

export function useCheckInQr() {
  return useQuery<CheckInQrResponse>({
    queryKey: ['organization', 'check-in-qr'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations/me/check-in-qr');
      return response.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

