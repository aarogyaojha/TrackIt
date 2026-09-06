import * as React from 'react';
import Link from 'next/link';
import { APP_NAME, MARKETING_COPY, ROUTES } from '@/constants/app.constants';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.HOME}
          className="text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <Link
            href={ROUTES.LOGIN}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            {MARKETING_COPY.LOGIN_LINK}
          </Link>
          <Link
            href={ROUTES.REGISTER}
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          >
            {MARKETING_COPY.REGISTER_BUTTON}
          </Link>
        </div>
      </div>
    </header>
  );
}
