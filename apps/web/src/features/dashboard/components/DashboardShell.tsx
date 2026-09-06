import * as React from 'react';
import type { AuthUser } from '@/lib/redux/authSlice';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { APP_NAME } from '@/constants/app.constants';
import { DASHBOARD_COPY } from '../dashboard.constants';

export interface DashboardShellProps {
  user: AuthUser | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  onLogout,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              {DASHBOARD_COPY.BADGE}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-sm text-right">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            )}
            <ThemeToggle />
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={onLogout}>
              {DASHBOARD_COPY.LOGOUT_BUTTON}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
