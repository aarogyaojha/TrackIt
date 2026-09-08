import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { TicketStatus } from '@trackit/types';

// Standalone unauthenticated Axios client for public tracking routes.
// Intentionally isolated from the shared apiClient (lib/api/client.ts) to guarantee
// no credentials, access tokens, or refresh interceptors are ever attached.
const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PublicTicketStatusHistory {
  status: TicketStatus;
  changedAt: string;
}

export interface PublicTicketData {
  organizationName: string;
  code: string;
  customerName: string;
  itemDescription: string;
  status: TicketStatus;
  statusHistory: PublicTicketStatusHistory[];
  createdAt?: string;
}

export function usePublicTicket(orgSlug: string, code: string) {
  return useQuery<PublicTicketData>({
    queryKey: ['public-ticket', orgSlug, code],
    queryFn: async () => {
      const response = await publicApi.get<{
        success: boolean;
        data: PublicTicketData;
      }>(`/public/${encodeURIComponent(orgSlug)}/tickets/${encodeURIComponent(code)}`);

      return response.data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: false,
    enabled: Boolean(orgSlug && code),
  });
}
