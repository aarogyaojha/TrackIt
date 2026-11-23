'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Role, UserResponse } from '@trackit/types';
import { useRoles } from '@/features/roles/api/useRoles';
import { useUpdateTeamMember } from '../api/useUpdateTeamMember';
import { TEAM_COPY } from '../team.constants';
import { toast } from 'sonner';

interface EditTeamMemberDialogProps {
  member: UserResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

interface EditTeamMemberInnerProps {
  member: UserResponse;
  currentUserId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditTeamMemberInner({
  member,
  currentUserId,
  onSuccess,
  onCancel,
}: EditTeamMemberInnerProps) {
  const [name, setName] = React.useState(member.name);
  const [role, setRole] = React.useState<string>(member.role);
  const [isActive, setIsActive] = React.useState<boolean>(member.isActive);

  const { data: roles } = useRoles();
  const { mutate: updateMember, isPending } = useUpdateTeamMember();

  const isSelf = member.id === currentUserId;

  const assignableRoles = React.useMemo(() => {
    if (!roles) return [];
    return roles.filter((r) => r.key !== Role.SUPERADMIN && r.key !== 'SUPERADMIN');
  }, [roles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Full name is required.');
      return;
    }

    updateMember(
      {
        id: member.id,
        payload: {
          name: name.trim(),
          role,
          isActive: isSelf ? undefined : isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(TEAM_COPY.TOAST.UPDATE_SUCCESS);
          onSuccess();
        },
        onError: (err) => {
          const message =
            (err as { response?: { data?: { error?: { message?: string } } } })
              ?.response?.data?.error?.message || TEAM_COPY.TOAST.ERROR_GENERIC;
          toast.error(message);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="edit-staff-name">
          {TEAM_COPY.EDIT_DIALOG.NAME_LABEL}
        </Label>
        <Input
          id="edit-staff-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-staff-role">
          {TEAM_COPY.EDIT_DIALOG.ROLE_LABEL}
        </Label>
        <Select value={role} onValueChange={(val) => val && setRole(val)}>
          <SelectTrigger id="edit-staff-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assignableRoles.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isSelf && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
          <div className="space-y-0.5">
            <Label htmlFor="edit-staff-status" className="font-medium">
              {TEAM_COPY.EDIT_DIALOG.ACTIVE_TOGGLE_LABEL}
            </Label>
            <p className="text-xs text-muted-foreground">
              {TEAM_COPY.EDIT_DIALOG.ACTIVE_TOGGLE_HELP}
            </p>
          </div>
          <Switch
            id="edit-staff-status"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isPending}
          />
        </div>
      )}

      <DialogFooter className="pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {TEAM_COPY.EDIT_DIALOG.CANCEL}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : TEAM_COPY.EDIT_DIALOG.SUBMIT}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditTeamMemberDialog({
  member,
  open,
  onOpenChange,
  currentUserId,
}: EditTeamMemberDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TEAM_COPY.EDIT_DIALOG.TITLE}</DialogTitle>
          <DialogDescription>
            {TEAM_COPY.EDIT_DIALOG.DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EditTeamMemberInner
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
