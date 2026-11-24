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
import { Textarea } from '@/components/ui/textarea';
import {
  PERMISSION_GROUPS,
  Permission,
  RoleResponse,
} from '@trackit/types';
import { useCreateRole } from '../api/useCreateRole';
import { useUpdateRole } from '../api/useUpdateRole';
import { ROLES_COPY } from '../roles.constants';
import { toast } from 'sonner';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: RoleResponse | null;
}

interface RoleFormInnerProps {
  roleToEdit?: RoleResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function RoleFormInner({
  roleToEdit,
  onSuccess,
  onCancel,
}: RoleFormInnerProps) {
  const isEditing = Boolean(roleToEdit);
  const isSystemRole = Boolean(roleToEdit?.isSystem);

  const [name, setName] = React.useState(roleToEdit?.name || '');
  const [key, setKey] = React.useState(roleToEdit?.key || '');
  const [description, setDescription] = React.useState(
    roleToEdit?.description || '',
  );
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    Permission[]
  >(roleToEdit?.permissions || []);

  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const isSaving = isCreating || isUpdating;

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleSelectAll = () => {
    const allPerms: Permission[] = [];
    PERMISSION_GROUPS.forEach((group) => {
      group.permissions.forEach((p) => {
        allPerms.push(p.key);
      });
    });
    setSelectedPermissions(Array.from(new Set(allPerms)));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Role name is required.');
      return;
    }

    if (!isEditing && !key.trim()) {
      toast.error('Role key is required.');
      return;
    }

    if (isEditing && roleToEdit) {
      updateRole(
        {
          id: roleToEdit.id,
          payload: {
            name: isSystemRole ? undefined : name.trim(),
            description: description.trim(),
            permissions: selectedPermissions,
          },
        },
        {
          onSuccess: () => {
            toast.success(ROLES_COPY.TOAST.UPDATE_SUCCESS);
            onSuccess();
          },
          onError: (err) => {
            const message =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ||
              ROLES_COPY.TOAST.ERROR_GENERIC;
            toast.error(message);
          },
        },
      );
    } else {
      createRole(
        {
          name: name.trim(),
          key: key.toUpperCase().trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        },
        {
          onSuccess: () => {
            toast.success(ROLES_COPY.TOAST.CREATE_SUCCESS);
            onSuccess();
          },
          onError: (err) => {
            const message =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ||
              ROLES_COPY.TOAST.ERROR_GENERIC;
            toast.error(message);
          },
        },
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">{ROLES_COPY.FORM.NAME_LABEL}</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ROLES_COPY.FORM.NAME_PLACEHOLDER}
              disabled={isSystemRole || isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-key">{ROLES_COPY.FORM.KEY_LABEL}</Label>
            <Input
              id="role-key"
              value={key}
              onChange={(e) =>
                setKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))
              }
              placeholder={ROLES_COPY.FORM.KEY_PLACEHOLDER}
              disabled={isEditing || isSaving}
              required
            />
            <p className="text-xs text-muted-foreground">
              {ROLES_COPY.FORM.KEY_HELP}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">
            {ROLES_COPY.FORM.DESCRIPTION_LABEL}
          </Label>
          <Textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={ROLES_COPY.FORM.DESCRIPTION_PLACEHOLDER}
            rows={2}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 sticky top-0 bg-popover/90 backdrop-blur-xs z-10 pt-1">
            <div>
              <Label className="text-base font-semibold">
                {ROLES_COPY.FORM.PERMISSIONS_LABEL}
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.length} permission(s) granted
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {ROLES_COPY.FORM.SELECT_ALL}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
              >
                {ROLES_COPY.FORM.DESELECT_ALL}
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            {PERMISSION_GROUPS.map((group) => (
              <div
                key={group.category}
                className="rounded-lg border p-4 bg-muted/20 space-y-3"
              >
                <h4 className="font-medium text-sm text-foreground">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.permissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-start gap-3 p-2.5 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.key)}
                          disabled={isSaving}
                          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium leading-none">
                            {perm.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-border/40 shrink-0 mt-3 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          {ROLES_COPY.FORM.CANCEL}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? 'Saving...'
            : isEditing
              ? ROLES_COPY.FORM.SUBMIT_EDIT
              : ROLES_COPY.FORM.SUBMIT_CREATE}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RoleFormDialog({
  open,
  onOpenChange,
  roleToEdit,
}: RoleFormDialogProps) {
  const isEditing = Boolean(roleToEdit);
  const isSystemRole = Boolean(roleToEdit?.isSystem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[88vh] flex flex-col p-6 overflow-hidden gap-0">
        <DialogHeader className="pb-4 shrink-0">
          <DialogTitle>
            {isEditing
              ? ROLES_COPY.FORM.EDIT_TITLE
              : ROLES_COPY.FORM.CREATE_TITLE}
          </DialogTitle>
          <DialogDescription>
            {isSystemRole
              ? 'Configure granular access permissions for this built-in system role.'
              : 'Define role metadata and select the permissions granted to this role.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RoleFormInner
            key={roleToEdit?.id || 'new-role'}
            roleToEdit={roleToEdit}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
