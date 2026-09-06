'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/app.constants';
import { useLogout } from '@/features/auth/api/useLogout';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitializing } = useRequireAuth();
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

  if (!user) {
    return null;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      {children}
    </DashboardShell>
  );
}
