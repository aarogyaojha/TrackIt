import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { clearSession } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import type { ApiErrorResponse } from './useLogin';

export function useLogout() {
  const dispatch = useAppDispatch();

  return useMutation<
    { message: string },
    AxiosError<ApiErrorResponse>,
    void
  >({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/logout', {});
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      dispatch(clearSession());
    },
    onError: () => {
      // Even if API logout fails (e.g. token already expired), clear local session
      dispatch(clearSession());
    },
  });
}
