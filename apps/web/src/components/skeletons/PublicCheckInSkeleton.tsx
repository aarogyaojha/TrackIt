import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PublicCheckInSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="text-center space-y-3 pb-4">
          <Skeleton className="size-10 rounded-full mx-auto" />
          <Skeleton className="h-4 w-28 mx-auto" />
          <Skeleton className="h-7 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

