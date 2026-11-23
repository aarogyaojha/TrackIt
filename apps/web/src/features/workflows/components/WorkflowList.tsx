'use client';

import * as React from 'react';
import { Edit2Icon, GitBranchIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkflowSummary } from '../api/types';
import { useDeleteWorkflow } from '../api/useDeleteWorkflow';
import {
  WORKFLOW_DELETE_CONFIRM,
  WORKFLOW_TABLE_HEADERS,
  WORKFLOWS_PAGE_COPY,
} from '../workflows.constants';

export interface WorkflowListProps {
  workflows: WorkflowSummary[];
  onEdit: (workflowId: string) => void;
  canManage: boolean;
}

export function WorkflowList({
  workflows,
  onEdit,
  canManage,
}: WorkflowListProps) {
  const { mutate: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();

  const handleDelete = (id: string) => {
    deleteWorkflow(id, {
      onSuccess: () => {
        toast.success(WORKFLOW_DELETE_CONFIRM.DELETE_SUCCESS);
      },
      onError: (err) => {
        const message =
          err.response?.data?.error?.message ||
          WORKFLOW_DELETE_CONFIRM.DELETE_ERROR_DEFAULT;
        toast.error(message);
      },
    });
  };

  if (!workflows || workflows.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <GitBranchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">{WORKFLOWS_PAGE_COPY.EMPTY_TITLE}</CardTitle>
          <CardDescription>{WORKFLOWS_PAGE_COPY.EMPTY_DESCRIPTION}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{WORKFLOW_TABLE_HEADERS.NAME}</TableHead>
              <TableHead>{WORKFLOW_TABLE_HEADERS.DESCRIPTION}</TableHead>
              <TableHead className="text-center">
                {WORKFLOW_TABLE_HEADERS.STATUS_COUNT}
              </TableHead>
              <TableHead className="text-center">
                {WORKFLOW_TABLE_HEADERS.IS_DEFAULT}
              </TableHead>
              <TableHead className="text-center">
                {WORKFLOW_TABLE_HEADERS.STATUS}
              </TableHead>
              {canManage && (
                <TableHead className="text-right">
                  {WORKFLOW_TABLE_HEADERS.ACTIONS}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((wf) => (
              <TableRow key={wf.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <GitBranchIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{wf.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {wf.description || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {wf.statusCount}
                </TableCell>
                <TableCell className="text-center">
                  {wf.isDefault ? (
                    <Badge variant="default" className="text-xs">
                      {WORKFLOWS_PAGE_COPY.DEFAULT_BADGE}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={wf.isActive ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {wf.isActive
                      ? WORKFLOWS_PAGE_COPY.ACTIVE_BADGE
                      : WORKFLOWS_PAGE_COPY.INACTIVE_BADGE}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(wf.id)}
                        title={WORKFLOW_TABLE_HEADERS.EDIT_ACTION}
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>

                      {!wf.isDefault && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={isDeleting}
                              title={WORKFLOW_TABLE_HEADERS.DELETE_ACTION}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {WORKFLOW_DELETE_CONFIRM.TITLE}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {WORKFLOW_DELETE_CONFIRM.DESCRIPTION}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {WORKFLOW_DELETE_CONFIRM.CANCEL_BUTTON}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(wf.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {WORKFLOW_DELETE_CONFIRM.CONFIRM_BUTTON}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

