import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api/public-client';
import { PublicTicketData } from './usePublicTicket';

export function useLookupTickets(orgSlug: string, query: string, enabled = false) {
  return useQuery<PublicTicketData[]>({
    queryKey: ['public-lookup', orgSlug, query],
    queryFn: async () => {
      const response = await publicApi.get<{
        success: boolean;
        data: PublicTicketData[];
      }>(`/public/${encodeURIComponent(orgSlug)}/lookup`, {
        params: { query: query.trim() },
      });
      return response.data.data;
    },
    enabled: Boolean(orgSlug && query.trim() && enabled),
    retry: false,
  });
}

