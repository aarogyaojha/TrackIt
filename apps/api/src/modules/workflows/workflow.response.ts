import { StatusCategory } from '@trackit/types';
import { WorkflowDocument } from './workflow.schema';

export interface WorkflowStatusResponse {
  key: string;
  name: string;
  customerLabel?: string;
  customerDescription?: string;
  category: StatusCategory;
  color?: string;
  order: number;
}

export interface WorkflowSummaryResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  statusCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowDetailResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  statuses: WorkflowStatusResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function toWorkflowSummaryResponse(
  workflow: WorkflowDocument,
): WorkflowSummaryResponse {
  return {
    id: workflow._id.toString(),
    organizationId: workflow.organizationId.toString(),
    name: workflow.name,
    description: workflow.description || '',
    isDefault: workflow.isDefault,
    isActive: workflow.isActive,
    statusCount: workflow.statuses?.length || 0,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

export function toWorkflowResponse(
  workflow: WorkflowDocument,
): WorkflowDetailResponse {
  const sortedStatuses = [...(workflow.statuses || [])].sort(
    (a, b) => a.order - b.order,
  );

  return {
    id: workflow._id.toString(),
    organizationId: workflow.organizationId.toString(),
    name: workflow.name,
    description: workflow.description || '',
    isDefault: workflow.isDefault,
    isActive: workflow.isActive,
    statuses: sortedStatuses.map((s) => ({
      key: s.key,
      name: s.name,
      customerLabel: s.customerLabel || s.name,
      customerDescription: s.customerDescription || '',
      category: s.category,
      color: s.color || 'default',
      order: s.order,
    })),
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

