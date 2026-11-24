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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 min-h-[148px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3.5 w-36" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
      {/* Total Tickets */}
      <Card className="border-l-4 border-l-primary shadow-xs p-6 min-h-[148px] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.TOTAL_TITLE}
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <TicketIcon className="size-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {totalTickets}
            </div>
            <Badge variant="outline" className="text-xs font-normal shrink-0">
              {completionRate}% {DASHBOARD_METRICS_COPY.COMPLETION_RATE}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {DASHBOARD_METRICS_COPY.TOTAL_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Active in Progress */}
      <Card className="border-l-4 border-l-amber-500 shadow-xs p-6 min-h-[148px] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.ACTIVE_TITLE}
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <ClockIcon className="size-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {activeTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {DASHBOARD_METRICS_COPY.ACTIVE_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Completed Tickets */}
      <Card className="border-l-4 border-l-emerald-500 shadow-xs p-6 min-h-[148px] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.COMPLETED_TITLE}
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2Icon className="size-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {completedTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {DASHBOARD_METRICS_COPY.COMPLETED_DESC}
          </p>
        </CardContent>
      </Card>

      {/* Cancelled Tickets */}
      <Card className="border-l-4 border-l-rose-500 shadow-xs p-6 min-h-[148px] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {DASHBOARD_METRICS_COPY.CANCELLED_TITLE}
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircleIcon className="size-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {cancelledTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {DASHBOARD_METRICS_COPY.CANCELLED_DESC}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

