'use client';

import * as React from 'react';
import { useRefreshSession } from '@/features/auth/api/useRefreshSession';
import { setInitializing } from '@/lib/redux/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { mutate: refreshSession } = useRefreshSession();
  const hasAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      refreshSession(undefined, {
        onSettled: () => {
          dispatch(setInitializing(false));
        },
      });
    }
  }, [refreshSession, dispatch]);

  return <>{children}</>;
}
