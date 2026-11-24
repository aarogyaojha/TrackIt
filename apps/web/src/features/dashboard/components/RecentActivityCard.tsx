'use client';

import * as React from 'react';
import Link from 'next/link';
import { RecentTicketActivity } from '@trackit/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityIcon, ArrowRightIcon } from 'lucide-react';
import { DASHBOARD_ACTIVITY_COPY } from '../dashboard.constants';
import {
  STATUS_CATEGORY_BADGE_VARIANTS,
  STATUS_CATEGORY_LABELS,
} from '@/features/workflows/workflows.constants';
import { ROUTES } from '@/constants/app.constants';

interface RecentActivityCardProps {
  recentActivity?: RecentTicketActivity[];
  isLoading?: boolean;
}

export function RecentActivityCard({
  recentActivity = [],
  isLoading,
}: RecentActivityCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {DASHBOARD_ACTIVITY_COPY.TITLE}
          </CardTitle>
          <CardDescription>
            {DASHBOARD_ACTIVITY_COPY.DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-5 text-primary" />
            <CardTitle className="text-lg">
              {DASHBOARD_ACTIVITY_COPY.TITLE}
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {DASHBOARD_ACTIVITY_COPY.DESCRIPTION}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {DASHBOARD_ACTIVITY_COPY.EMPTY}
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((ticket) => {
              const badgeVariant =
                STATUS_CATEGORY_BADGE_VARIANTS[ticket.statusCategory] ||
                'default';
              const categoryLabel =
                STATUS_CATEGORY_LABELS[ticket.statusCategory] ||
                ticket.statusCategory;

              return (
                <Link
                  key={ticket.id}
                  href={`${ROUTES.TICKETS}/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {ticket.code}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {ticket.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {ticket.itemDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={badgeVariant}
                      className="text-[10px] capitalize"
                    >
                      {categoryLabel}
                    </Badge>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-center"
          >
            <Link href={ROUTES.TICKETS}>
              {DASHBOARD_ACTIVITY_COPY.VIEW_ALL_BUTTON}
              <ArrowRightIcon className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
