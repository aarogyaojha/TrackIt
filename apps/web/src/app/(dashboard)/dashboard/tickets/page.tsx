'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { TicketStatus } from '@trackit/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTickets } from '@/features/tickets/api/useTickets';
import { CreateTicketDialog } from '@/features/tickets/components/CreateTicketDialog';
import { TicketFiltersBar } from '@/features/tickets/components/TicketFiltersBar';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { TICKETS_LIST_COPY } from '@/features/tickets/tickets.constants';

export default function TicketsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const statusParam = searchParams.get('status');
  const status = Object.values(TicketStatus).includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;
  const search = searchParams.get('search') || '';

  const { data, isPending, isError, error } = useTickets({
    page,
    limit: 10,
    status,
    search,
  });

  const updateUrl = React.useCallback(
    (newParams: {
      page?: number;
      status?: TicketStatus;
      search?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newParams.page !== undefined) {
        if (newParams.page <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(newParams.page));
        }
      }

      if (newParams.status !== undefined) {
        if (!newParams.status) {
          params.delete('status');
        } else {
          params.set('status', newParams.status);
        }
      }

      if (newParams.search !== undefined) {
        const trimmed = newParams.search.trim();
        if (!trimmed) {
          params.delete('search');
        } else {
          params.set('search', trimmed);
        }
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [searchParams, router, pathname],
  );

  const handleSearchChange = (newSearch: string) => {
    updateUrl({ search: newSearch, page: 1 });
  };

  const handleStatusChange = (newStatus?: TicketStatus) => {
    updateUrl({ status: newStatus, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const tickets = data?.data || [];
  const meta = data?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {TICKETS_LIST_COPY.TITLE}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {TICKETS_LIST_COPY.DESCRIPTION}
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-1 size-4" />
          {TICKETS_LIST_COPY.CREATE_BUTTON}
        </Button>
      </div>

      <TicketFiltersBar
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {error?.message || 'Failed to load tickets.'}
        </div>
      ) : (
        <div className="space-y-4">
          <TicketTable tickets={tickets} />

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {TICKETS_LIST_COPY.PAGINATION_PAGE_INFO} {meta.page}{' '}
                {TICKETS_LIST_COPY.PAGINATION_OF} {meta.totalPages} (
                {meta.total} total)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                >
                  <ChevronLeftIcon className="mr-1 size-4" />
                  {TICKETS_LIST_COPY.PAGINATION_PREVIOUS}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                >
                  {TICKETS_LIST_COPY.PAGINATION_NEXT}
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
