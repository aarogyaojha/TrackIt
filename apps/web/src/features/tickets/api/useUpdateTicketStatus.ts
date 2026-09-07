import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { subscriptionKeys } from '@/features/subscription/api/subscription-keys';
import { ticketKeys } from './ticket-keys';
import { Ticket, UpdateTicketStatusPayload } from './types';
import { ApiErrorResponse } from './useCreateTicket';

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Ticket,
    AxiosError<ApiErrorResponse>,
    UpdateTicketStatusPayload
  >({
    mutationFn: async ({ id, status }: UpdateTicketStatusPayload) => {
      const response = await apiClient.patch(`/tickets/${id}/status`, { status });
      return response.data?.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific ticket detail and list queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage() });
    },
  });
}
