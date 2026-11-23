import { StatusCategory } from '@trackit/types';

export interface WorkflowStatus {
  key: string;
  name: string;
  customerLabel?: string;
  customerDescription?: string;
  category: StatusCategory;
  color?: string;
  order: number;
}

export interface WorkflowSummary {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  statusCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowDetail {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  statuses: WorkflowStatus[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  isDefault?: boolean;
  statuses: Array<{
    key: string;
    name: string;
    customerLabel?: string;
    customerDescription?: string;
    category: StatusCategory;
    color?: string;
    order: number;
  }>;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  statuses?: Array<{
    key: string;
    name: string;
    customerLabel?: string;
    customerDescription?: string;
    category: StatusCategory;
    color?: string;
    order: number;
  }>;
}

