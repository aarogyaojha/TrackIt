'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@trackit/types';
import { ROUTES } from '@/constants/app.constants';
import { useAppSelector } from '@/lib/redux/hooks';

export function useRequireSuperAdmin() {
  const router = useRouter();
  const { user, isInitializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        router.push(ROUTES.LOGIN);
      } else if (user.role !== Role.SUPERADMIN) {
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [isInitializing, user, router]);

  return { user, isInitializing };
}
