import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { clearSession, setSession } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import type { ApiErrorResponse, LoginResponseData } from './useLogin';

export function useRefreshSession() {
  const dispatch = useAppDispatch();

  return useMutation<
    LoginResponseData,
    AxiosError<ApiErrorResponse>,
    void
  >({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/refresh', {});
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      dispatch(
        setSession({
          accessToken: data.accessToken,
          user: data.user,
        }),
      );
    },
    onError: () => {
      dispatch(clearSession());
    },
  });
}
