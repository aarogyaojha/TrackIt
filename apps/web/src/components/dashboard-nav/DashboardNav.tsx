'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DashboardNavProps {
  items: NavItem[];
  className?: string;
  onItemClick?: () => void;
}

export function DashboardNav({ items, className, onItemClick }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-1.5', className)} aria-label="Sidebar Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        // Exact match for base dashboard, prefix match for subpaths
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'size-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
            )}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
