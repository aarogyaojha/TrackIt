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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Role } from '@trackit/types';
import { useRoles } from '@/features/roles/api/useRoles';
import { useCreateTeamMember } from '../api/useCreateTeamMember';
import { TEAM_COPY } from '../team.constants';
import { toast } from 'sonner';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AddTeamMemberInnerProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddTeamMemberInner({ onSuccess, onCancel }: AddTeamMemberInnerProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<string>(Role.ORG_STAFF);

  const { data: roles } = useRoles();
  const { mutate: createMember, isPending } = useCreateTeamMember();

  // Filter out platform superadmin from organization assignment options
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
    if (!email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (!role) {
      toast.error('Please assign a role.');
      return;
    }

    createMember(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      },
      {
        onSuccess: () => {
          toast.success(TEAM_COPY.TOAST.CREATE_SUCCESS);
          onSuccess();
        },
        onError: (err) => {
          const resError = (
            err as { response?: { data?: { error?: { code?: string; message?: string } } } }
          )?.response?.data?.error;
          const code = resError?.code;
          const message =
            code === 'PLAN_LIMIT_EXCEEDED'
              ? TEAM_COPY.TOAST.PLAN_LIMIT_REACHED
              : resError?.message || TEAM_COPY.TOAST.ERROR_GENERIC;
          toast.error(message);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="staff-name">{TEAM_COPY.ADD_DIALOG.NAME_LABEL}</Label>
        <Input
          id="staff-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={TEAM_COPY.ADD_DIALOG.NAME_PLACEHOLDER}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-email">
          {TEAM_COPY.ADD_DIALOG.EMAIL_LABEL}
        </Label>
        <Input
          id="staff-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={TEAM_COPY.ADD_DIALOG.EMAIL_PLACEHOLDER}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-password">
          {TEAM_COPY.ADD_DIALOG.PASSWORD_LABEL}
        </Label>
        <Input
          id="staff-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={TEAM_COPY.ADD_DIALOG.PASSWORD_PLACEHOLDER}
          disabled={isPending}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-role">{TEAM_COPY.ADD_DIALOG.ROLE_LABEL}</Label>
        <Select value={role} onValueChange={(val) => val && setRole(val)}>
          <SelectTrigger id="staff-role" className="w-full">
            <SelectValue placeholder={TEAM_COPY.ADD_DIALOG.ROLE_PLACEHOLDER} />
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

      <DialogFooter className="pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {TEAM_COPY.ADD_DIALOG.CANCEL}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : TEAM_COPY.ADD_DIALOG.SUBMIT}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
}: AddTeamMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TEAM_COPY.ADD_DIALOG.TITLE}</DialogTitle>
          <DialogDescription>
            {TEAM_COPY.ADD_DIALOG.DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AddTeamMemberInner
            key="add-member-form"
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
