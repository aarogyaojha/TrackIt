import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { superadminKeys } from './superadmin-keys';
import { ApiErrorResponse, PlatformSettings } from './types';

export function usePlatformSettings() {
  return useQuery<PlatformSettings>({
    queryKey: superadminKeys.platformSettings,
    queryFn: async () => {
      const response = await apiClient.get('/platform-settings');
      return response.data?.data;
    },
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();

  return useMutation<PlatformSettings, AxiosError<ApiErrorResponse>, PlatformSettings>({
    mutationFn: async (payload: PlatformSettings) => {
      const response = await apiClient.patch('/platform-settings', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superadminKeys.platformSettings });
    },
  });
}
