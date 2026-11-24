'use client';

import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/lib/redux/hooks';
import { DASHBOARD_COPY } from '@/features/dashboard/dashboard.constants';
import { CreateTicketDialog } from '@/features/tickets/components/CreateTicketDialog';
import { TICKETS_LIST_COPY } from '@/features/tickets/tickets.constants';
import { UsageSummary } from '@/features/subscription/components/UsageSummary';
import { CounterQrCard } from '@/features/dashboard/components/CounterQrCard';
import { TicketMetricsCards } from '@/features/dashboard/components/TicketMetricsCards';
import { WorkflowStagesCard } from '@/features/dashboard/components/WorkflowStagesCard';
import { TeamPerformanceCard } from '@/features/dashboard/components/TeamPerformanceCard';
import { RecentActivityCard } from '@/features/dashboard/components/RecentActivityCard';
import { useDashboardStats } from '@/features/dashboard/api/useDashboardStats';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { formatRoleName } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = usePermissions();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const { data: stats, isLoading } = useDashboardStats({
    enabled: permissions.canViewTickets,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">
              {DASHBOARD_COPY.WELCOME_TITLE}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {DASHBOARD_COPY.LOGGED_IN_AS}{' '}
              <span className="font-semibold text-foreground">
                {user?.name || DASHBOARD_COPY.DEFAULT_USER_NAME}
              </span>{' '}
              (<span className="font-medium text-foreground">{formatRoleName(user?.role)}</span>)
            </p>
          </div>

          {permissions.canCreateTickets && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="mr-1 size-4" />
              {TICKETS_LIST_COPY.CREATE_BUTTON}
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Overview KPI Cards (Gated by canViewTickets) */}
      {permissions.canViewTickets && (
        <TicketMetricsCards
          overview={stats?.overview}
          isLoading={isLoading}
        />
      )}

      {/* Workflow Stage Pipeline & Recent Activity (Gated by canViewTickets) */}
      {permissions.canViewTickets && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <WorkflowStagesCard
              workflows={stats?.workflows}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-4">
            <RecentActivityCard
              recentActivity={stats?.recentActivity}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Team Member Contribution & Leaderboard (Gated by canViewUsers) */}
      {permissions.canViewUsers && (
        <TeamPerformanceCard
          staffPerformance={stats?.staffPerformance}
          isLoading={isLoading}
        />
      )}

      {/* Operational Cards: Customer Counter QR & Plan Usage (Gated by canViewQr / canViewSubscription) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {permissions.canViewQr && <CounterQrCard />}
        {permissions.canViewSubscription && <UsageSummary />}
      </div>

      {permissions.canCreateTickets && (
        <CreateTicketDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </div>
  );
}
