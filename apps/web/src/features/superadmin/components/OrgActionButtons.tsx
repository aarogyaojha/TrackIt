'use client';

import * as React from 'react';
import { OrgStatus } from '@trackit/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import {
  useApproveOrg,
  useRejectOrg,
  useSuspendOrg,
  useReactivateOrg,
} from '../api';
import { ORG_STATUS_ACTIONS, SUPERADMIN_COPY } from '../superadmin.constants';

export interface OrgActionButtonsProps {
  org: {
    id: string;
    status: OrgStatus;
    name?: string;
  };
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function OrgActionButtons({
  org,
  size = 'sm',
  className,
}: OrgActionButtonsProps) {
  const validActions = ORG_STATUS_ACTIONS[org.status] || [];

  const approveMutation = useApproveOrg();
  const rejectMutation = useRejectOrg();
  const suspendMutation = useSuspendOrg();
  const reactivateMutation = useReactivateOrg();

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    reactivateMutation.isPending;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(org.id);
      toast.success(SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.APPROVE_SUCCESS);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to approve organization';
      toast.error(errorMsg);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(org.id);
      toast.success(SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REJECT_SUCCESS);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to reject organization';
      toast.error(errorMsg);
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendMutation.mutateAsync(org.id);
      toast.success(SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.SUSPEND_SUCCESS);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to suspend organization';
      toast.error(errorMsg);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync(org.id);
      toast.success(SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REACTIVATE_SUCCESS);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to reactivate organization';
      toast.error(errorMsg);
    }
  };

  if (validActions.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {validActions.includes('approve') && (
        <Button
          size={size}
          variant="default"
          onClick={handleApprove}
          disabled={isPending}
        >
          {approveMutation.isPending
            ? SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.APPROVING
            : SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.APPROVE}
        </Button>
      )}

      {validActions.includes('reactivate') && (
        <Button
          size={size}
          variant="outline"
          onClick={handleReactivate}
          disabled={isPending}
        >
          {reactivateMutation.isPending
            ? SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REACTIVATING
            : SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REACTIVATE}
        </Button>
      )}

      {validActions.includes('reject') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size={size} variant="destructive" disabled={isPending}>
              {rejectMutation.isPending
                ? SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REJECTING
                : SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.REJECT}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {SUPERADMIN_COPY.DIALOGS.REJECT.TITLE}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {SUPERADMIN_COPY.DIALOGS.REJECT.DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {SUPERADMIN_COPY.DIALOGS.REJECT.CANCEL}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {SUPERADMIN_COPY.DIALOGS.REJECT.CONFIRM}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {validActions.includes('suspend') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size={size} variant="destructive" disabled={isPending}>
              {suspendMutation.isPending
                ? SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.SUSPENDING
                : SUPERADMIN_COPY.ORGANIZATIONS.ACTIONS.SUSPEND}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {SUPERADMIN_COPY.DIALOGS.SUSPEND.TITLE}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {SUPERADMIN_COPY.DIALOGS.SUSPEND.DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {SUPERADMIN_COPY.DIALOGS.SUSPEND.CANCEL}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSuspend}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {SUPERADMIN_COPY.DIALOGS.SUSPEND.CONFIRM}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
