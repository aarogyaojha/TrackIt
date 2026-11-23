'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RoleResponse } from '@trackit/types';
import { useDeleteRole } from '../api/useDeleteRole';
import { ROLES_COPY } from '../roles.constants';
import { toast } from 'sonner';

interface DeleteRoleDialogProps {
  role: RoleResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRoleDialog({
  role,
  open,
  onOpenChange,
}: DeleteRoleDialogProps) {
  const { mutate: deleteRole, isPending } = useDeleteRole();

  if (!role) return null;

  const handleConfirm = () => {
    deleteRole(role.id, {
      onSuccess: () => {
        toast.success(ROLES_COPY.TOAST.DELETE_SUCCESS);
        onOpenChange(false);
      },
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message || ROLES_COPY.TOAST.ERROR_GENERIC;
        toast.error(message);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ROLES_COPY.DELETE_DIALOG.TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {ROLES_COPY.DELETE_DIALOG.DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {ROLES_COPY.DELETE_DIALOG.CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : ROLES_COPY.DELETE_DIALOG.CONFIRM}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
