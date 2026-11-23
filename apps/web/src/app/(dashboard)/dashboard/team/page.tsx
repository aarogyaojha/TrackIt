'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon } from 'lucide-react';
import { UserResponse } from '@trackit/types';
import { useTeamMembers } from '@/features/team/api/useTeamMembers';
import { useSubscriptionUsage } from '@/features/subscription/api/useSubscriptionUsage';
import { TeamTable } from '@/features/team/components/TeamTable';
import { AddTeamMemberDialog } from '@/features/team/components/AddTeamMemberDialog';
import { EditTeamMemberDialog } from '@/features/team/components/EditTeamMemberDialog';
import { DeleteTeamMemberDialog } from '@/features/team/components/DeleteTeamMemberDialog';
import { TEAM_COPY } from '@/features/team/team.constants';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useAppSelector } from '@/lib/redux/hooks';

export default function TeamPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: members, isLoading } = useTeamMembers();
  const { data: subscription } = useSubscriptionUsage();

  const [addOpen, setAddOpen] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [memberToEdit, setMemberToEdit] = React.useState<UserResponse | null>(
    null,
  );

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [memberToDelete, setMemberToDelete] =
    React.useState<UserResponse | null>(null);

  const handleEdit = (member: UserResponse) => {
    setMemberToEdit(member);
    setEditOpen(true);
  };

  const handleDelete = (member: UserResponse) => {
    setMemberToDelete(member);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const currentCount = members?.length || 0;
  const maxStaff = subscription?.limits.maxStaffUsers;
  const isLimitReached = maxStaff !== undefined && currentCount >= maxStaff;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {TEAM_COPY.PAGE_TITLE}
            </h1>
            {maxStaff !== undefined && (
              <Badge
                variant={isLimitReached ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {currentCount} / {maxStaff} {TEAM_COPY.USAGE_LABEL}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {TEAM_COPY.PAGE_DESCRIPTION}
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="self-start sm:self-auto"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {TEAM_COPY.ADD_MEMBER_BUTTON}
        </Button>
      </div>

      <TeamTable
        members={members || []}
        currentUserId={currentUser?.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddTeamMemberDialog open={addOpen} onOpenChange={setAddOpen} />

      <EditTeamMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={memberToEdit}
        currentUserId={currentUser?.id}
      />

      <DeleteTeamMemberDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        member={memberToDelete}
      />
    </div>
  );
}
