import QRCode from 'qrcode';
import { StatusCategory, TicketStatus } from '@trackit/types';
import { TicketDocument } from './ticket.schema';

export interface TicketStatusHistoryResponse {
  status: TicketStatus | string;
  changedAt: Date;
  changedBy: string;
}

export interface TicketResponse {
  id: string;
  workflowId?: string;
  code: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  status: TicketStatus | string;
  statusCategory?: StatusCategory;
  statusHistory: TicketStatusHistoryResponse[];
  createdAt?: Date;
  updatedAt?: Date;
  publicUrl: string;
  qrCodeDataUrl: string;
}

export interface PublicTicketStageResponse {
  customerLabel: string;
  customerDescription?: string;
  category: StatusCategory;
}

export interface PublicTicketStatusHistoryResponse {
  customerLabel: string;
  changedAt: Date;
}

export interface PublicTicketResponse {
  organizationName: string;
  code: string;
  customerName: string;
  itemDescription: string;
  customerLabel: string;
  customerDescription?: string;
  category: StatusCategory;
  stages: PublicTicketStageResponse[];
  statusHistory: PublicTicketStatusHistoryResponse[];
  createdAt?: Date;
}

export interface PublicWorkflowOptionResponse {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface PublicIntakeInfoResponse {
  organizationName: string;
  orgSlug: string;
  workflows: PublicWorkflowOptionResponse[];
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
    workflowId: ticket.workflowId ? ticket.workflowId.toString() : undefined,
    code: ticket.code,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    itemDescription: ticket.itemDescription,
    status: ticket.status,
    statusCategory: ticket.statusCategory,
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
  workflow?: {
    statuses?: Array<{
      key: string;
      name?: string;
      customerLabel?: string;
      customerDescription?: string;
      category: StatusCategory;
      order?: number;
    }>;
  },
): PublicTicketResponse {
  const statuses = workflow?.statuses || [];
  const currentStatusDef = statuses.find(
    (s) => s.key.toLowerCase() === (ticket.status || '').toLowerCase(),
  );

  const customerLabel =
    currentStatusDef?.customerLabel || ticket.status || '';
  const customerDescription = currentStatusDef?.customerDescription;
  const category =
    currentStatusDef?.category ||
    ticket.statusCategory ||
    StatusCategory.INITIAL;

  const stages: PublicTicketStageResponse[] = [...statuses]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      customerLabel: s.customerLabel || s.name || s.key,
      customerDescription: s.customerDescription,
      category: s.category,
    }));

  const statusHistory: PublicTicketStatusHistoryResponse[] = (
    ticket.statusHistory || []
  ).map((history) => {
    const historyDef = statuses.find(
      (s) => s.key.toLowerCase() === (history.status || '').toLowerCase(),
    );
    return {
      customerLabel: historyDef?.customerLabel || history.status,
      changedAt: history.changedAt,
    };
  });

  return {
    organizationName: orgName,
    code: ticket.code,
    customerName: ticket.customerName,
    itemDescription: ticket.itemDescription,
    customerLabel,
    customerDescription,
    category,
    stages,
    statusHistory,
    createdAt: ticket.createdAt,
  };
}

