import { TicketStatus } from '@trackit/types';

export interface TicketStatusHistoryItem {
  status: TicketStatus;
  changedAt: string | Date;
  changedBy: string;
}

export interface Ticket {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  status: TicketStatus;
  statusHistory: TicketStatusHistoryItem[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  publicUrl: string;
  qrCodeDataUrl: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
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
}

export interface UpdateTicketStatusPayload {
  id: string;
  status: TicketStatus;
}
