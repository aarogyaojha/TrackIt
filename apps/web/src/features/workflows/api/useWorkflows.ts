import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { WorkflowSummary } from './types';
import { workflowKeys } from './workflow-keys';

export function useWorkflows(activeOnly = false) {
  return useQuery<WorkflowSummary[]>({
    queryKey: workflowKeys.list(activeOnly),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: WorkflowSummary[];
      }>('/workflows', {
        params: activeOnly ? { activeOnly: true } : undefined,
      });

      return response.data.data;
    },
  });
}

