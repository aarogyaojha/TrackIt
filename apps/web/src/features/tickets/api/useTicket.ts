import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ticketKeys } from './ticket-keys';
import { Ticket } from './types';

export function useTicket(id: string) {
  return useQuery<Ticket>({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/tickets/${id}`);
      return response.data?.data;
    },
    enabled: Boolean(id),
  });
}
