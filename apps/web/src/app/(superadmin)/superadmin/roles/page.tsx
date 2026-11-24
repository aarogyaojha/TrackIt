'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { RoleResponse } from '@trackit/types';
import { useRoles } from '@/features/roles/api/useRoles';
import { RolesTable } from '@/features/roles/components/RolesTable';
import { RoleFormDialog } from '@/features/roles/components/RoleFormDialog';
import { DeleteRoleDialog } from '@/features/roles/components/DeleteRoleDialog';
import { ROLES_COPY } from '@/features/roles/roles.constants';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function SuperAdminRolesPage() {
  const { data: roles, isLoading } = useRoles();

  const [formOpen, setFormOpen] = React.useState(false);
  const [roleToEdit, setRoleToEdit] = React.useState<RoleResponse | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<RoleResponse | null>(
    null,
  );

  const handleCreate = () => {
    setRoleToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (role: RoleResponse) => {
    setRoleToEdit(role);
    setFormOpen(true);
  };

  const handleDelete = (role: RoleResponse) => {
    setRoleToDelete(role);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {ROLES_COPY.PAGE_TITLE}
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {ROLES_COPY.PAGE_DESCRIPTION}
          </p>
        </div>
        <Button onClick={handleCreate} className="self-start sm:self-auto h-10 px-5 text-sm font-medium">
          <PlusIcon className="mr-1.5 size-4" />
          {ROLES_COPY.ADD_ROLE_BUTTON}
        </Button>
      </div>

      <RolesTable
        roles={roles || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        roleToEdit={roleToEdit}
      />

      <DeleteRoleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        role={roleToDelete}
      />
    </div>
  );
}
