'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOrganizationMe } from '@/features/organization/api/useOrganizationMe';
import { UsageSummary } from '@/features/subscription/components/UsageSummary';
import { SETTINGS_COPY } from '@/features/subscription/subscription.constants';

export default function SettingsPage() {
  const { data: org, isPending, isError, error } = useOrganizationMe();
  const [copiedSlug, setCopiedSlug] = React.useState(false);

  const handleCopySlug = async () => {
    if (!org?.slug) return;
    try {
      await navigator.clipboard.writeText(org.slug);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      // Fallback if clipboard fails
    }
  };

  const formattedCreated = org?.createdAt
    ? new Date(org.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {SETTINGS_COPY.PAGE_TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {SETTINGS_COPY.PAGE_DESCRIPTION}
        </p>
      </div>

      {isPending ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {error?.message || 'Failed to load organization settings.'}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {SETTINGS_COPY.ORG_PROFILE_TITLE}
              </CardTitle>
              {org?.status && (
                <Badge
                  variant={org.status === 'ACTIVE' ? 'success' : 'warning'}
                >
                  {org.status}
                </Badge>
              )}
            </div>
            <CardDescription>
              {SETTINGS_COPY.ORG_PROFILE_DESCRIPTION}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {SETTINGS_COPY.ORG_NAME_LABEL}
                </span>
                <p className="text-base font-semibold text-foreground">
                  {org?.name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {SETTINGS_COPY.REGISTERED_ON_LABEL}
                </span>
                <p className="text-base font-medium text-foreground">
                  {formattedCreated}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                {SETTINGS_COPY.ORG_SLUG_LABEL}
              </span>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  readOnly
                  value={org?.slug || ''}
                  className="flex-1 min-w-0 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-foreground font-mono focus:outline-hidden"
                />
                <Tooltip open={copiedSlug ? true : undefined}>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopySlug}
                        aria-label={SETTINGS_COPY.COPY_SLUG_BUTTON}
                      >
                        {copiedSlug ? (
                          <CheckIcon className="size-4 text-success" />
                        ) : (
                          <CopyIcon className="size-4" />
                        )}
                      </Button>
                    }
                  />
                  <TooltipContent>
                    {SETTINGS_COPY.SLUG_COPIED_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <UsageSummary />
    </div>
  );
}
