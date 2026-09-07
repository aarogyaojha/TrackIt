'use client';

import * as React from 'react';
import { OrgStatus } from '@trackit/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUPERADMIN_COPY } from '../superadmin.constants';

export interface OrgStatusTabsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function OrgStatusTabs({
  value,
  onChange,
  className,
}: OrgStatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className={className}>
      <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-grid">
        <TabsTrigger value="ALL">
          {SUPERADMIN_COPY.ORGANIZATIONS.TABS.ALL}
        </TabsTrigger>
        <TabsTrigger value={OrgStatus.PENDING}>
          {SUPERADMIN_COPY.ORGANIZATIONS.TABS.PENDING}
        </TabsTrigger>
        <TabsTrigger value={OrgStatus.ACTIVE}>
          {SUPERADMIN_COPY.ORGANIZATIONS.TABS.ACTIVE}
        </TabsTrigger>
        <TabsTrigger value={OrgStatus.SUSPENDED}>
          {SUPERADMIN_COPY.ORGANIZATIONS.TABS.SUSPENDED}
        </TabsTrigger>
        <TabsTrigger value={OrgStatus.REJECTED}>
          {SUPERADMIN_COPY.ORGANIZATIONS.TABS.REJECTED}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
