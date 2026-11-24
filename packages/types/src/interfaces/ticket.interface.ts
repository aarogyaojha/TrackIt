import { StatusCategory } from '../enums/status-category.enum';

export interface WorkflowStageStat {
  key: string;
  name: string;
  category: StatusCategory;
  color?: string;
  count: number;
}

export interface WorkflowStatsSummary {
  workflowId: string;
  workflowName: string;
  isDefault: boolean;
  totalTickets: number;
  stages: WorkflowStageStat[];
}

export interface StaffPerformanceStat {
  userId: string;
  name: string;
  email: string;
  role: string;
  ticketsCreated: number;
  ticketsCompleted: number;
  totalStatusUpdates: number;
}

export interface RecentTicketActivity {
  id: string;
  code: string;
  customerName: string;
  itemDescription: string;
  status: string;
  statusCategory: StatusCategory;
  updatedAt: string;
}

export interface TicketDashboardStatsResponse {
  overview: {
    totalTickets: number;
    activeTickets: number;
    completedTickets: number;
    cancelledTickets: number;
    completionRate: number;
  };
  workflows: WorkflowStatsSummary[];
  staffPerformance: StaffPerformanceStat[];
  recentActivity: RecentTicketActivity[];
}

