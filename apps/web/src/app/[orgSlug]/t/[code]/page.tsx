'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { AlertCircle, ClockAlert } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicTicketSkeleton } from '@/components/skeletons/PublicTicketSkeleton';
import { ROUTES } from '@/constants/app.constants';
import { usePublicTicket } from '@/features/public-tracking/api/usePublicTicket';
import { PublicTicketView } from '@/features/public-tracking/components/PublicTicketView';
import { PUBLIC_TRACKING_COPY } from '@/features/public-tracking/public-tracking.constants';

export default function PublicTicketPage() {
  const params = useParams();
  const orgSlug = typeof params?.orgSlug === 'string' ? params.orgSlug : '';
  const code = typeof params?.code === 'string' ? params.code : '';

  const { data: ticket, isLoading, error } = usePublicTicket(orgSlug, code);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top utility bar with ThemeToggle */}
      <header className="w-full border-b border-border/40 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="text-sm font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            {PUBLIC_TRACKING_COPY.FOOTER_ATTRIBUTION_BRAND}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <PublicTicketSkeleton />
        ) : error ? (
          <div className="w-full max-w-md mx-auto px-4 py-12">
            {(() => {
              const axiosError = error as AxiosError<{
                error?: { code?: string };
              }>;
              const isRateLimited =
                axiosError.response?.status === 429 ||
                axiosError.response?.data?.error?.code === 'RATE_LIMITED';

              if (isRateLimited) {
                return (
                  <Card className="shadow-sm border-amber-500/30 bg-amber-500/5 text-center">
                    <CardHeader className="flex flex-col items-center space-y-2 pb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <ClockAlert className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">
                        {PUBLIC_TRACKING_COPY.RATE_LIMITED_TITLE}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {PUBLIC_TRACKING_COPY.RATE_LIMITED_DESCRIPTION}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              // Privacy-preserving error display: deliberately never distinguishes 404 from suspended/missing org or other errors
              return (
                <Card className="shadow-sm text-center">
                  <CardHeader className="flex flex-col items-center space-y-2 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">
                      {PUBLIC_TRACKING_COPY.NOT_FOUND_TITLE}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {PUBLIC_TRACKING_COPY.NOT_FOUND_DESCRIPTION}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={ROUTES.HOME}>Go to Homepage</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        ) : ticket ? (
          <PublicTicketView ticket={ticket} />
        ) : null}
      </main>
    </div>
  );
}
