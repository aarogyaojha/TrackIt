'use client';

import * as React from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_COPY } from '@/features/dashboard/dashboard.constants';

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{DASHBOARD_COPY.WELCOME_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {DASHBOARD_COPY.LOGGED_IN_AS}{' '}
            <span className="font-semibold text-foreground">
              {user?.name || DASHBOARD_COPY.DEFAULT_USER_NAME}
            </span>{' '}
            (<span className="font-medium text-foreground">{user?.role}</span>)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
