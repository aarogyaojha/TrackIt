import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { publicApi } from '@/lib/api/public-client';
import { PublicTicketData } from '@/features/public-tracking/api/usePublicTicket';
import { PublicCheckInFormData } from '../schemas/public-check-in.schema';

interface SubmitPublicTicketArgs {
  orgSlug: string;
  payload: PublicCheckInFormData;
}

export function useSubmitPublicTicket() {
  return useMutation<
    PublicTicketData,
    AxiosError<{ error?: { code?: string; message?: string } }>,
    SubmitPublicTicketArgs
  >({
    mutationFn: async ({ orgSlug, payload }) => {
      const response = await publicApi.post<{
        success: boolean;
        data: PublicTicketData;
      }>(`/public/${encodeURIComponent(orgSlug)}/tickets`, payload);
      return response.data.data;
    },
  });
}

