import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import type { ApiErrorResponse } from './useLogin';
import type { VerifyEmailFormData } from '../schemas/verify-email.schema';

export interface VerifyEmailResponseData {
  message: string;
}

export function useVerifyEmail() {
  return useMutation<
    VerifyEmailResponseData,
    AxiosError<ApiErrorResponse>,
    VerifyEmailFormData
  >({
    mutationFn: async (payload: VerifyEmailFormData) => {
      const response = await apiClient.post('/auth/verify-email', payload);
      return response.data?.data || response.data;
    },
  });
}
