'use client';

import * as React from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { APP_NAME, MARKETING_COPY, ROUTES } from '@/constants/app.constants';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.HOME}
          className="text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          {APP_NAME}
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4">
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

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? MARKETING_COPY.CLOSE_MENU : MARKETING_COPY.TOGGLE_MENU}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-card px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <Link
            href={ROUTES.LOGIN}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'w-full justify-center')}
          >
            {MARKETING_COPY.LOGIN_LINK}
          </Link>
          <Link
            href={ROUTES.REGISTER}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full justify-center')}
          >
            {MARKETING_COPY.REGISTER_BUTTON}
          </Link>
        </div>
      )}
    </header>
  );
}
