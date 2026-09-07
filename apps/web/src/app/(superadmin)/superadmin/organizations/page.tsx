'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { OrgStatus } from '@trackit/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  OrgStatusTabs,
  OrganizationsTable,
} from '@/features/superadmin/components';
import { useOrganizationsList } from '@/features/superadmin/api';
import { SUPERADMIN_COPY } from '@/features/superadmin/superadmin.constants';

export default function SuperAdminOrganizationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const statusParam = searchParams.get('status');

  // Default to PENDING if not specified; if explicitly 'ALL', statusFilter is undefined
  const currentTab = statusParam ?? OrgStatus.PENDING;
  const statusFilter: OrgStatus | undefined =
    currentTab === 'ALL'
      ? undefined
      : Object.values(OrgStatus).includes(currentTab as OrgStatus)
        ? (currentTab as OrgStatus)
        : OrgStatus.PENDING;

  const { data, isPending, isError, error } = useOrganizationsList({
    page,
    limit: 10,
    status: statusFilter,
  });

  const updateUrl = React.useCallback(
    (newParams: { page?: number; status?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newParams.page !== undefined) {
        if (newParams.page <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(newParams.page));
        }
      }

      if (newParams.status !== undefined) {
        params.set('status', newParams.status);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [searchParams, router, pathname],
  );

  const handleTabChange = (newTab: string) => {
    updateUrl({ status: newTab, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const organizations = data?.data || [];
  const meta = data?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const emptyMessage =
    currentTab === 'ALL'
      ? SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.ALL
      : currentTab === OrgStatus.ACTIVE
        ? SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.ACTIVE
        : currentTab === OrgStatus.SUSPENDED
          ? SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.SUSPENDED
          : currentTab === OrgStatus.REJECTED
            ? SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.REJECTED
            : SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.PENDING;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {SUPERADMIN_COPY.ORGANIZATIONS.TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {SUPERADMIN_COPY.ORGANIZATIONS.DESCRIPTION}
        </p>
      </div>

      <OrgStatusTabs value={currentTab} onChange={handleTabChange} />

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {error?.message || 'Failed to load organizations.'}
        </div>
      ) : (
        <div className="space-y-4">
          <OrganizationsTable
            organizations={organizations}
            emptyMessage={emptyMessage}
          />

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                >
                  <ChevronLeftIcon className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                >
                  Next
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
