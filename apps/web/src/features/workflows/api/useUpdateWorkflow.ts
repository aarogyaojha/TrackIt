import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { UpdateWorkflowPayload, WorkflowDetail } from './types';
import { workflowKeys } from './workflow-keys';

interface ErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowDetail,
    AxiosError<ErrorEnvelope>,
    { id: string; payload: UpdateWorkflowPayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await apiClient.patch<{
        success: boolean;
        data: WorkflowDetail;
      }>(`/workflows/${id}`, payload);

      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(variables.id),
      });
    },
  });
}

