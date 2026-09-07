'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2Icon, LayersIcon, SettingsIcon } from 'lucide-react';
import { Role } from '@trackit/types';
import { ROUTES } from '@/constants/app.constants';
import { useLogout } from '@/features/auth/api/useLogout';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { NavItem } from '@/components/dashboard-nav/DashboardNav';
import { useRequireSuperAdmin } from '@/features/superadmin/hooks/useRequireSuperAdmin';
import { SUPERADMIN_COPY } from '@/features/superadmin/superadmin.constants';

const SUPERADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: SUPERADMIN_COPY.NAV.ORGANIZATIONS,
    href: ROUTES.SUPERADMIN_ORGANIZATIONS,
    icon: Building2Icon,
  },
  {
    label: SUPERADMIN_COPY.NAV.PLANS,
    href: ROUTES.SUPERADMIN_PLANS,
    icon: LayersIcon,
  },
  {
    label: SUPERADMIN_COPY.NAV.SETTINGS,
    href: ROUTES.SUPERADMIN_SETTINGS,
    icon: SettingsIcon,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitializing } = useRequireSuperAdmin();
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        router.push(ROUTES.LOGIN);
      },
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen p-8 max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user || user.role !== Role.SUPERADMIN) {
    return null;
  }

  return (
    <DashboardShell
      user={user}
      onLogout={handleLogout}
      navItems={SUPERADMIN_NAV_ITEMS}
      portalLabel={SUPERADMIN_COPY.PORTAL_LABEL}
    >
      {children}
    </DashboardShell>
  );
}
