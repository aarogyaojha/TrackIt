'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePlatformSettings, useUpdatePlatformSettings } from '../api';
import { SUPERADMIN_COPY } from '../superadmin.constants';

export function PlatformSettingsToggle() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettingsMutation = useUpdatePlatformSettings();

  const handleCheckedChange = async (checked: boolean) => {
    try {
      await updateSettingsMutation.mutateAsync({
        requireOrgApproval: checked,
      });
      toast.success(
        checked
          ? SUPERADMIN_COPY.SETTINGS.TOGGLE_SUCCESS_ENABLED
          : SUPERADMIN_COPY.SETTINGS.TOGGLE_SUCCESS_DISABLED,
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to update platform settings';
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isChecked = settings?.requireOrgApproval ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{SUPERADMIN_COPY.SETTINGS.TITLE}</CardTitle>
        <CardDescription>
          {SUPERADMIN_COPY.SETTINGS.DESCRIPTION}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="require-org-approval-toggle"
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              {SUPERADMIN_COPY.SETTINGS.REQUIRE_APPROVAL_TITLE}
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {SUPERADMIN_COPY.SETTINGS.REQUIRE_APPROVAL_DESCRIPTION}
            </p>
          </div>
          <Switch
            id="require-org-approval-toggle"
            checked={isChecked}
            onCheckedChange={handleCheckedChange}
            disabled={updateSettingsMutation.isPending}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
