'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TicketIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import { DASHBOARD_METRICS_COPY } from '../dashboard.constants';

interface TicketMetricsCardsProps {
  overview?: {
    totalTickets: number;
    activeTickets: number;
    completedTickets: number;
    cancelledTickets: number;
    completionRate: number;
  };
  isLoading?: boolean;
}

export function TicketMetricsCards({
  overview,
  isLoading,
}: TicketMetricsCardsProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    totalTickets,
    activeTickets,
    completedTickets,
    cancelledTickets,
    completionRate,
  } = overview;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tickets */}
      <Card className="border-l-4 border-l-primary shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.TOTAL_TITLE}
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <TicketIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight">
              {totalTickets}
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              {completionRate}% {DASHBOARD_METRICS_COPY.COMPLETION_RATE}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {DASHBOARD_METRICS_COPY.TOTAL_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Active in Progress */}
      <Card className="border-l-4 border-l-amber-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.ACTIVE_TITLE}
          </CardTitle>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <ClockIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {activeTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {DASHBOARD_METRICS_COPY.ACTIVE_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Completed Tickets */}
      <Card className="border-l-4 border-l-emerald-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.COMPLETED_TITLE}
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2Icon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {completedTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {DASHBOARD_METRICS_COPY.COMPLETED_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Cancelled Tickets */}
      <Card className="border-l-4 border-l-rose-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.CANCELLED_TITLE}
          </CardTitle>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
            <XCircleIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {cancelledTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {DASHBOARD_METRICS_COPY.CANCELLED_DESC}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

