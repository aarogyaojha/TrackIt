import QRCode from 'qrcode';
import { TicketStatus } from '@trackit/types';
import { TicketDocument } from './ticket.schema';

export interface TicketStatusHistoryResponse {
  status: TicketStatus;
  changedAt: Date;
  changedBy: string;
}

export interface TicketResponse {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  status: TicketStatus;
  statusHistory: TicketStatusHistoryResponse[];
  createdAt?: Date;
  updatedAt?: Date;
  publicUrl: string;
  qrCodeDataUrl: string;
}

export interface PublicTicketStatusHistoryResponse {
  status: TicketStatus;
  changedAt: Date;
}

export interface PublicTicketResponse {
  organizationName: string;
  code: string;
  customerName: string;
  itemDescription: string;
  status: TicketStatus;
  statusHistory: PublicTicketStatusHistoryResponse[];
  createdAt?: Date;
}

export async function toTicketResponse(
  ticket: TicketDocument,
  orgSlug: string,
  corsOrigin: string,
): Promise<TicketResponse> {
  const publicUrl = `${corsOrigin}/${orgSlug}/t/${ticket.code}`;
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl);

  return {
    id: ticket._id.toString(),
    code: ticket.code,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    itemDescription: ticket.itemDescription,
    status: ticket.status,
    statusHistory: (ticket.statusHistory || []).map((history) => ({
      status: history.status,
      changedAt: history.changedAt,
      changedBy: history.changedBy ? history.changedBy.toString() : '',
    })),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    publicUrl,
    qrCodeDataUrl,
  };
}

export function toPublicTicketResponse(
  ticket: TicketDocument,
  orgName: string,
): PublicTicketResponse {
  return {
    organizationName: orgName,
    code: ticket.code,
    customerName: ticket.customerName,
    itemDescription: ticket.itemDescription,
    status: ticket.status,
    statusHistory: (ticket.statusHistory || []).map(
      ({ status, changedAt }) => ({
        status,
        changedAt,
      }),
    ),
    createdAt: ticket.createdAt,
  };
}
