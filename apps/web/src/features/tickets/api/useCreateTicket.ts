import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { subscriptionKeys } from '@/features/subscription/api/subscription-keys';
import { ticketKeys } from './ticket-keys';
import { CreateTicketPayload, Ticket } from './types';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation<
    Ticket,
    AxiosError<ApiErrorResponse>,
    CreateTicketPayload
  >({
    mutationFn: async (payload: CreateTicketPayload) => {
      const response = await apiClient.post('/tickets', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      // Invalidate tickets lists and subscription usage
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage() });
    },
  });
}
