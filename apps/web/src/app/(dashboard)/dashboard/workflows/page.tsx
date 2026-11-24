'use client';

import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import { Role } from '@trackit/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { useWorkflows } from '@/features/workflows/api/useWorkflows';
import {
  WorkflowFormDialog,
  WorkflowList,
} from '@/features/workflows/components';
import { WORKFLOWS_PAGE_COPY } from '@/features/workflows/workflows.constants';

export default function WorkflowsPage() {
  const { user } = useRequireAuth();
  const { data: workflows, isLoading, isError } = useWorkflows();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = React.useState<
    string | null
  >(null);

  const canManage = user?.role === Role.ORG_ADMIN;

  const handleCreate = () => {
    setEditingWorkflowId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingWorkflowId(id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {WORKFLOWS_PAGE_COPY.PAGE_TITLE}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {WORKFLOWS_PAGE_COPY.PAGE_DESCRIPTION}
          </p>
        </div>

        {canManage && (
          <Button onClick={handleCreate} className="gap-2 shrink-0 h-10 px-5 text-sm font-medium">
            <PlusIcon className="h-4 w-4" />
            {WORKFLOWS_PAGE_COPY.CREATE_BUTTON}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {WORKFLOWS_PAGE_COPY.ERROR_MESSAGE}
        </div>
      ) : (
        <WorkflowList
          workflows={workflows || []}
          onEdit={handleEdit}
          canManage={canManage}
        />
      )}

      {canManage && (
        <WorkflowFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          workflowId={editingWorkflowId}
        />
      )}
    </div>
  );
}

