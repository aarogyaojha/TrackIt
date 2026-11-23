import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { CreateWorkflowPayload, WorkflowDetail } from './types';
import { workflowKeys } from './workflow-keys';

interface ErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowDetail,
    AxiosError<ErrorEnvelope>,
    CreateWorkflowPayload
  >({
    mutationFn: async (payload: CreateWorkflowPayload) => {
      const response = await apiClient.post<{
        success: boolean;
        data: WorkflowDetail;
      }>('/workflows', payload);

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

