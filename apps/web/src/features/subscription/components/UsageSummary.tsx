'use client';

import * as React from 'react';
import { PlanTier } from '@trackit/types';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Progress,
  ProgressLabel,
} from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionUsage } from '../api/useSubscriptionUsage';
import { SUBSCRIPTION_COPY } from '../subscription.constants';

export function UsageSummary() {
  const { data: subscription, isPending, isError } = useSubscriptionUsage();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !subscription) {
    return null;
  }

  const { planTier, limits, usage } = subscription;

  const metrics = [
    {
      id: 'activeTickets',
      label: SUBSCRIPTION_COPY.ACTIVE_TICKETS_LABEL,
      usage: usage.activeTickets ?? 0,
      limit: limits.maxActiveTickets,
    },
    {
      id: 'staffUsers',
      label: SUBSCRIPTION_COPY.STAFF_USERS_LABEL,
      usage: usage.staffUsers ?? 0,
      limit: limits.maxStaffUsers,
    },
    {
      id: 'ticketsThisMonth',
      label: SUBSCRIPTION_COPY.TICKETS_THIS_MONTH_LABEL,
      usage: usage.ticketsThisMonth ?? 0,
      limit: limits.maxTicketsPerMonth,
    },
  ];

  const getTierBadgeVariant = (tier: PlanTier) => {
    switch (tier) {
      case PlanTier.PRO:
        return 'success';
      case PlanTier.BASIC:
        return 'default';
      case PlanTier.FREE:
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {SUBSCRIPTION_COPY.SECTION_TITLE}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {SUBSCRIPTION_COPY.CURRENT_PLAN}:
            </span>
            <Badge variant={getTierBadgeVariant(planTier)}>
              {planTier}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {SUBSCRIPTION_COPY.SECTION_DESCRIPTION}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => {
            const hasLimit = typeof metric.limit === 'number' && metric.limit > 0;
            const percentage = hasLimit
              ? Math.min(100, Math.round((metric.usage / metric.limit) * 100))
              : 0;
            const isNearLimit = hasLimit && percentage >= 90;

            const valueText = hasLimit
              ? `${metric.usage} / ${metric.limit}`
              : `${metric.usage} (${SUBSCRIPTION_COPY.UNLIMITED})`;

            return (
              <div
                key={metric.id}
                className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
              >
                <Progress
                  value={percentage}
                  className={
                    isNearLimit
                      ? '[&_[data-slot=progress-indicator]]:bg-warning'
                      : ''
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <ProgressLabel className="text-xs font-medium text-foreground">
                      {metric.label}
                    </ProgressLabel>
                    <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">
                      {valueText}
                    </span>
                  </div>
                </Progress>

                {isNearLimit && (
                  <p className="text-xs text-warning font-medium">
                    {SUBSCRIPTION_COPY.LIMIT_WARNING} ({percentage}%)
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>{SUBSCRIPTION_COPY.UPGRADE_PROMPT}</span>
        </div>
      </CardContent>
    </Card>
  );
}
