import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import type { ApiErrorResponse } from './useLogin';

export interface ResendVerificationOtpPayload {
  email: string;
}

export interface ResendVerificationOtpResponseData {
  message: string;
}

export function useResendVerificationOtp() {
  return useMutation<
    ResendVerificationOtpResponseData,
    AxiosError<ApiErrorResponse>,
    ResendVerificationOtpPayload
  >({
    mutationFn: async (payload: ResendVerificationOtpPayload) => {
      const response = await apiClient.post(
        '/auth/resend-email-verification',
        payload,
      );
      return response.data?.data || response.data;
    },
  });
}
