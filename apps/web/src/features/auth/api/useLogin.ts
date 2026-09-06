import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { setSession, AuthUser } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import type { LoginFormData } from '../schemas/login.schema';

export interface LoginResponseData {
  accessToken: string;
  user: AuthUser;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation<
    LoginResponseData,
    AxiosError<ApiErrorResponse>,
    LoginFormData
  >({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await apiClient.post('/auth/login', credentials);
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
  });
}
