import * as React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { APP_NAME, ROUTES } from '@/constants/app.constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/40">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Link
          href={ROUTES.HOME}
          className="text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          {APP_NAME}
        </Link>
      </div>
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
