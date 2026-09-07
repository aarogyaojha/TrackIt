import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ticketKeys } from './ticket-keys';
import { PaginatedTicketsResponse, TicketListParams } from './types';

export function useTickets(params: TicketListParams = {}) {
  return useQuery<PaginatedTicketsResponse>({
    queryKey: ticketKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get('/tickets', {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status || undefined,
          search: params.search?.trim() ? params.search.trim() : undefined,
        },
      });

      // API envelope returns { success: true, data: Ticket[], meta: { total, page, limit, totalPages } }
      return response.data;
    },
  });
}
