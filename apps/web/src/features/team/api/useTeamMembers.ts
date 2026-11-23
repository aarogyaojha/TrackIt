import { useQuery } from '@tanstack/react-query';
import { UserResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { teamKeys } from './team-keys';

export function useTeamMembers() {
  return useQuery<UserResponse[]>({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: UserResponse[];
      }>('/users');
      return response.data.data;
    },
  });
}
