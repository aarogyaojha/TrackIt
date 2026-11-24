'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MenuIcon, XIcon } from 'lucide-react';
import type { AuthUser } from '@/lib/redux/authSlice';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { APP_NAME } from '@/constants/app.constants';
import { DashboardNav, NavItem } from '@/components/dashboard-nav/DashboardNav';
import { DASHBOARD_COPY } from '../dashboard.constants';
import { formatRoleName } from '@/lib/utils';

export interface DashboardShellProps {
  user: AuthUser | null;
  onLogout: () => void;
  navItems: NavItem[];
  portalLabel?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  onLogout,
  navItems,
  portalLabel = DASHBOARD_COPY.BADGE,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Adjust state during rendering when route changes (React recommended pattern)
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Close mobile drawer on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileOpen]);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? DASHBOARD_COPY.CLOSE_MENU : DASHBOARD_COPY.TOGGLE_MENU}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </Button>

            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              {portalLabel}
            </span>
          </div>

          {/* Desktop Right Bar (User info, Theme, Logout) */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="text-sm text-right">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRoleName(user.role)}
                </p>
              </div>
            )}
            <ThemeToggle />
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={onLogout}>
              {DASHBOARD_COPY.LOGOUT_BUTTON}
            </Button>
          </div>

          {/* Mobile Right Bar (Theme Toggle) */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {portalLabel}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                  aria-label={DASHBOARD_COPY.CLOSE_MENU}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  {DASHBOARD_COPY.NAVIGATION_TITLE}
                </p>
                <DashboardNav
                  items={navItems}
                  onItemClick={() => setMobileOpen(false)}
                />
              </div>
            </div>

            {/* Mobile User Profile & Logout */}
            <div className="pt-4 border-t border-border space-y-3">
              {user && (
                <div className="text-sm px-1">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRoleName(user.role)}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
              >
                {DASHBOARD_COPY.LOGOUT_BUTTON}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row gap-6 lg:gap-8">
        <aside className="hidden md:block w-52 lg:w-60 shrink-0">
          <div className="sticky top-24">
            <DashboardNav items={navItems} />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
