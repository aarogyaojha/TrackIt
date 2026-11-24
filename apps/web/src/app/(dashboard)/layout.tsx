'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  GitBranchIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/app.constants';
import { useLogout } from '@/features/auth/api/useLogout';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { NavItem } from '@/components/dashboard-nav/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitializing } = useRequireAuth();
  const permissions = usePermissions();
  const { mutate: logout } = useLogout();

  const navItems = React.useMemo(() => {
    const items: NavItem[] = [
      { label: 'Overview', href: ROUTES.DASHBOARD, icon: LayoutDashboardIcon },
    ];
    if (permissions.canViewTickets) {
      items.push({ label: 'Tickets', href: ROUTES.TICKETS, icon: TicketIcon });
    }
    if (permissions.canViewWorkflows) {
      items.push({
        label: 'Workflows',
        href: ROUTES.WORKFLOWS,
        icon: GitBranchIcon,
      });
    }
    if (permissions.canViewUsers) {
      items.push({ label: 'Team', href: ROUTES.TEAM, icon: UsersIcon });
    }
    if (
      permissions.isOrgAdmin ||
      permissions.canViewQr ||
      permissions.canViewSubscription
    ) {
      items.push({
        label: 'Settings',
        href: ROUTES.SETTINGS,
        icon: SettingsIcon,
      });
    }
    return items;
  }, [permissions]);

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        router.push(ROUTES.LOGIN);
      },
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen p-6 sm:p-8 w-full">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell
      user={user}
      onLogout={handleLogout}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
