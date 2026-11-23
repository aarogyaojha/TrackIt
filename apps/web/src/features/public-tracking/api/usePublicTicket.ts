import { useQuery } from '@tanstack/react-query';
import { StatusCategory, TicketStatus } from '@trackit/types';
import { publicApi } from '@/lib/api/public-client';
import { WorkflowDetail } from '@/features/workflows/api/types';

export interface PublicTicketStage {
  customerLabel: string;
  customerDescription?: string;
  category: StatusCategory;
}

export interface PublicTicketStatusHistory {
  customerLabel?: string;
  status?: TicketStatus | string;
  changedAt: string;
}

export interface PublicTicketData {
  organizationName: string;
  code: string;
  customerName: string;
  itemDescription: string;
  customerLabel?: string;
  customerDescription?: string;
  category?: StatusCategory;
  status?: TicketStatus | string;
  statusCategory?: StatusCategory;
  stages?: PublicTicketStage[];
  statusHistory: PublicTicketStatusHistory[];
  workflow?: WorkflowDetail;
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
