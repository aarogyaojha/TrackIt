import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { workflowKeys } from './workflow-keys';

interface ErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ErrorEnvelope>, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

