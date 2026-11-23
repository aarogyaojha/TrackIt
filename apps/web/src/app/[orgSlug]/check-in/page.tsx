'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { AlertCircle, ClockAlert } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PublicCheckInSkeleton } from '@/components/skeletons/PublicCheckInSkeleton';
import { ROUTES } from '@/constants/app.constants';
import { usePublicIntake } from '@/features/public-intake/api/usePublicIntake';
import { PublicCheckInView } from '@/features/public-intake/components/PublicCheckInView';
import { PUBLIC_INTAKE_COPY } from '@/features/public-intake/public-intake.constants';

export default function PublicCheckInPage() {
  const params = useParams();
  const orgSlug = typeof params?.orgSlug === 'string' ? params.orgSlug : '';

  const { data: intake, isLoading, error } = usePublicIntake(orgSlug);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top utility bar */}
      <header className="w-full border-b border-border/40 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={ROUTES.HOME}
            className="text-sm font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            {PUBLIC_INTAKE_COPY.FOOTER_ATTRIBUTION_BRAND}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <PublicCheckInSkeleton />
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
                        {PUBLIC_INTAKE_COPY.RATE_LIMITED_TITLE}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {PUBLIC_INTAKE_COPY.RATE_LIMITED_DESCRIPTION}
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

              return (
                <Card className="shadow-sm text-center">
                  <CardHeader className="flex flex-col items-center space-y-2 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">
                      {PUBLIC_INTAKE_COPY.NOT_FOUND_TITLE}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {PUBLIC_INTAKE_COPY.NOT_FOUND_DESCRIPTION}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={ROUTES.HOME}>Go to Homepage</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        ) : intake ? (
          <PublicCheckInView intake={intake} />
        ) : null}
      </main>
    </div>
  );
}

