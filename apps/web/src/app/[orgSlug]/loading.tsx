import * as React from 'react';
import { OrgPortalSkeleton } from '@/components/skeletons/OrgPortalSkeleton';

export default function OrgPortalLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col justify-center">
        <OrgPortalSkeleton />
      </div>
    </div>
  );
}

