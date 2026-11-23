import { StatusCategory } from '../enums/status-category.enum';

export interface WorkflowStatusDefinition {
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
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail extends Omit<WorkflowSummary, 'statusCount'> {
  statuses: WorkflowStatusDefinition[];
}

