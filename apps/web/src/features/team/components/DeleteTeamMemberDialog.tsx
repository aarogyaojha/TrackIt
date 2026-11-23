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
import { UserResponse } from '@trackit/types';
import { useDeleteTeamMember } from '../api/useDeleteTeamMember';
import { TEAM_COPY } from '../team.constants';
import { toast } from 'sonner';

interface DeleteTeamMemberDialogProps {
  member: UserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTeamMemberDialog({
  member,
  open,
  onOpenChange,
}: DeleteTeamMemberDialogProps) {
  const { mutate: deleteMember, isPending } = useDeleteTeamMember();

  if (!member) return null;

  const handleConfirm = () => {
    deleteMember(member.id, {
      onSuccess: () => {
        toast.success(TEAM_COPY.TOAST.DELETE_SUCCESS);
        onOpenChange(false);
      },
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message || TEAM_COPY.TOAST.ERROR_GENERIC;
        toast.error(message);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{TEAM_COPY.DELETE_DIALOG.TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {TEAM_COPY.DELETE_DIALOG.DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {TEAM_COPY.DELETE_DIALOG.CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Removing...' : TEAM_COPY.DELETE_DIALOG.CONFIRM}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
