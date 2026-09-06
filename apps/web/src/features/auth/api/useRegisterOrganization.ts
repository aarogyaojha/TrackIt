import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import type { ApiErrorResponse } from './useLogin';

export interface RegisterOrganizationPayload {
  orgName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface RegisterOrganizationResponseData {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  };
}

export function useRegisterOrganization() {
  return useMutation<
    RegisterOrganizationResponseData,
    AxiosError<ApiErrorResponse>,
    RegisterOrganizationPayload
  >({
    mutationFn: async (payload: RegisterOrganizationPayload) => {
      const response = await apiClient.post('/organizations/register', payload);
      return response.data?.data || response.data;
    },
  });
}
