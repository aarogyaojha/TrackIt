'use client';

import { useQuery } from '@tanstack/react-query';
import { TicketDashboardStatsResponse } from '@trackit/types';
import { apiClient } from '@/lib/api/client';
import { dashboardKeys } from './dashboard-keys';

export function useDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<TicketDashboardStatsResponse> => {
      const response = await apiClient.get<{
        success: boolean;
        data: TicketDashboardStatsResponse;
      }>('/tickets/stats/summary');
      return (
        response.data?.data ??
        (response.data as unknown as TicketDashboardStatsResponse)
      );
    },
    enabled: options?.enabled !== false,
  });
}

