'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PlanTier } from '@trackit/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Progress,
  ProgressLabel,
} from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/app.constants';
import {
  SuperAdminOrganization,
  useChangeOrgTier,
  useOrgSubscription,
} from '../api';
import { SUPERADMIN_COPY } from '../superadmin.constants';
import { OrgActionButtons } from './OrgActionButtons';
import { OrgStatusBadge } from './OrgStatusBadge';

export interface OrgDetailViewProps {
  org: SuperAdminOrganization;
}

export function OrgDetailView({ org }: OrgDetailViewProps) {
  const {
    data: subscription,
    isLoading: isSubLoading,
  } = useOrgSubscription(org.id);

  const [userSelectedTier, setUserSelectedTier] = React.useState<PlanTier | null>(null);
  const changeTierMutation = useChangeOrgTier(org.id);

  const currentTier = subscription?.planTier;
  const selectedTier = userSelectedTier ?? currentTier ?? '';

  const handleChangeTier = async () => {
    if (!selectedTier) return;
    try {
      await changeTierMutation.mutateAsync({
        id: org.id,
        planTier: selectedTier as PlanTier,
      });
      setUserSelectedTier(null);
      toast.success(
        SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CHANGE_TIER_SUCCESS,
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to change plan tier';
      toast.error(errorMsg);
    }
  };

  const formattedCreatedDate = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const getTierBadgeVariant = (tier?: PlanTier) => {
    switch (tier) {
      case PlanTier.PRO:
        return 'success';
      case PlanTier.BASIC:
        return 'default';
      case PlanTier.FREE:
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.SUPERADMIN_ORGANIZATIONS} className="flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.BACK_LINK}
          </Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{org.name}</CardTitle>
            <CardDescription>
              {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.PROFILE_SECTION}
            </CardDescription>
          </div>
          <OrgActionButtons org={org} size="default" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.NAME_LABEL}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {org.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.SLUG_LABEL}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                {org.slug}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.STATUS_LABEL}
              </p>
              <div className="mt-1">
                <OrgStatusBadge status={org.status} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CREATED_LABEL}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formattedCreatedDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Usage Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.SUBSCRIPTION_SECTION}
              </CardTitle>
              <CardDescription>
                Current subscription tier and tenant resource usage.
              </CardDescription>
            </div>
            {subscription && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Plan:</span>
                <Badge variant={getTierBadgeVariant(subscription.planTier)}>
                  {subscription.planTier}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSubLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : subscription ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: 'activeTickets',
                    label: 'Active Tickets',
                    usage: subscription.usage?.activeTickets ?? 0,
                    limit: subscription.limits?.maxActiveTickets,
                  },
                  {
                    id: 'staffUsers',
                    label: 'Staff Users',
                    usage: subscription.usage?.staffUsers ?? 0,
                    limit: subscription.limits?.maxStaffUsers,
                  },
                  {
                    id: 'ticketsThisMonth',
                    label: 'Tickets This Month',
                    usage: subscription.usage?.ticketsThisMonth ?? 0,
                    limit: subscription.limits?.maxTicketsPerMonth,
                  },
                ].map((metric) => {
                  const hasLimit =
                    typeof metric.limit === 'number' && metric.limit > 0;
                  const percentage = hasLimit
                    ? Math.min(
                        100,
                        Math.round((metric.usage / metric.limit) * 100),
                      )
                    : 0;
                  const isNearLimit = hasLimit && percentage >= 90;
                  const valueText = hasLimit
                    ? `${metric.usage} / ${metric.limit}`
                    : `${metric.usage} (Unlimited)`;

                  return (
                    <div
                      key={metric.id}
                      className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
                    >
                      <Progress
                        value={percentage}
                        className={
                          isNearLimit
                            ? '[&_[data-slot=progress-indicator]]:bg-warning'
                            : ''
                        }
                      >
                        <div className="flex items-center justify-between w-full">
                          <ProgressLabel className="text-xs font-medium text-foreground">
                            {metric.label}
                          </ProgressLabel>
                          <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">
                            {valueText}
                          </span>
                        </div>
                      </Progress>
                      {isNearLimit && (
                        <p className="text-xs text-warning font-medium">
                          Limit Warning ({percentage}%)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tier Change Control */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CHANGE_TIER_TITLE}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CHANGE_TIER_DESCRIPTION}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="w-full sm:w-56">
                    <Select
                      value={selectedTier || undefined}
                      onValueChange={(val) =>
                        setUserSelectedTier((val as PlanTier) || null)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.SELECT_TIER_LABEL
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PlanTier.FREE}>
                          {PlanTier.FREE}
                        </SelectItem>
                        <SelectItem value={PlanTier.BASIC}>
                          {PlanTier.BASIC}
                        </SelectItem>
                        <SelectItem value={PlanTier.PRO}>
                          {PlanTier.PRO}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={
                          !selectedTier ||
                          selectedTier === subscription.planTier ||
                          changeTierMutation.isPending
                        }
                      >
                        {changeTierMutation.isPending
                          ? SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CHANGING_TIER
                          : SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.CHANGE_TIER_BUTTON}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {SUPERADMIN_COPY.DIALOGS.CHANGE_TIER.TITLE}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {SUPERADMIN_COPY.DIALOGS.CHANGE_TIER.DESCRIPTION}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {SUPERADMIN_COPY.DIALOGS.CHANGE_TIER.CANCEL}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleChangeTier}>
                          {SUPERADMIN_COPY.DIALOGS.CHANGE_TIER.CONFIRM}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Subscription data unavailable.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
