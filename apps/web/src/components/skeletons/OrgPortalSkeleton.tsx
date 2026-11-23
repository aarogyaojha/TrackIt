import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OrgPortalSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Organization Header Skeleton */}
      <Card className="shadow-sm border-primary/20 bg-card">
        <CardHeader className="text-center pb-5 space-y-3">
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-4 w-28 mx-auto rounded-full" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </CardHeader>
      </Card>

      {/* Search Card Skeleton */}
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-28" />
          </div>
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}

