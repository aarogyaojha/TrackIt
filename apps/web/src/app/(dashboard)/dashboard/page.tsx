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

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card>
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
              (<span className="font-medium text-foreground">{user?.role}</span>)
            </p>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="mr-1 size-4" />
            {TICKETS_LIST_COPY.CREATE_BUTTON}
          </Button>
        </CardHeader>
      </Card>

      <UsageSummary />

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
