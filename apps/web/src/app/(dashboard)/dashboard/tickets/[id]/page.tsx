'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicket } from '@/features/tickets/api/useTicket';
import { TicketDetailView } from '@/features/tickets/components/TicketDetailView';
import { TICKET_DETAIL_COPY } from '@/features/tickets/tickets.constants';
import { TicketDetailSkeleton } from '@/components/skeletons/TicketDetailSkeleton';

export default function TicketDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { data: ticket, isPending, isError, error } = useTicket(id || '');

  if (isPending) {
    return <TicketDetailSkeleton />;
  }

  if (isError) {
    const axiosError = error as AxiosError;
    const isNotFound = axiosError.response?.status === 404;

    if (isNotFound) {
      return (
        <Card className="max-w-xl mx-auto my-12 text-center">
          <CardHeader>
            <CardTitle className="text-xl">
              {TICKET_DETAIL_COPY.NOT_FOUND_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {TICKET_DETAIL_COPY.NOT_FOUND_DESCRIPTION}
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tickets">
                <ArrowLeftIcon className="mr-1 size-4" />
                {TICKET_DETAIL_COPY.NOT_FOUND_BUTTON}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
        {error?.message || 'An error occurred while loading ticket details.'}
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return <TicketDetailView ticket={ticket} />;
}
