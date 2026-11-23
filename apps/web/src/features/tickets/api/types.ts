import { StatusCategory, TicketStatus } from '@trackit/types';
import { WorkflowDetail } from '@/features/workflows/api/types';

export interface TicketStatusHistoryItem {
  status: TicketStatus | string;
  changedAt: string | Date;
  changedBy: string;
}

export interface Ticket {
  id: string;
  workflowId?: string;
  code: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  status: TicketStatus | string;
  statusCategory?: StatusCategory;
  statusHistory: TicketStatusHistoryItem[];
  workflow?: WorkflowDetail;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  publicUrl: string;
  qrCodeDataUrl: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | string;
  workflowId?: string;
  search?: string;
}

export interface PaginatedTicketsResponse {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTicketPayload {
  code: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  workflowId?: string;
}

export interface UpdateTicketStatusPayload {
  id: string;
  status: string;
}
