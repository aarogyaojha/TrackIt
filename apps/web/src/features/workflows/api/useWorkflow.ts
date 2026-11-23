import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { WorkflowDetail } from './types';
import { workflowKeys } from './workflow-keys';

export function useWorkflow(id?: string) {
  return useQuery<WorkflowDetail>({
    queryKey: workflowKeys.detail(id || ''),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: WorkflowDetail;
      }>(`/workflows/${id}`);

      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

