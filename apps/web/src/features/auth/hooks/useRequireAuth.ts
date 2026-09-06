'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/app.constants';
import { useAppSelector } from '@/lib/redux/hooks';

export function useRequireAuth() {
  const router = useRouter();
  const { user, isInitializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitializing && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [isInitializing, user, router]);

  return { user, isInitializing };
}
