'use client';

import * as React from 'react';
import { WorkflowStatsSummary } from '@trackit/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitBranchIcon } from 'lucide-react';
import { DASHBOARD_WORKFLOW_COPY } from '../dashboard.constants';
import {
  STATUS_CATEGORY_BADGE_VARIANTS,
  STATUS_CATEGORY_LABELS,
} from '@/features/workflows/workflows.constants';

interface WorkflowStagesCardProps {
  workflows?: WorkflowStatsSummary[];
  isLoading?: boolean;
}

export function WorkflowStagesCard({
  workflows = [],
  isLoading,
}: WorkflowStagesCardProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<
    string | null
  >(null);

  const activeWorkflowId = React.useMemo(() => {
    if (
      selectedWorkflowId &&
      workflows.some((w) => w.workflowId === selectedWorkflowId)
    ) {
      return selectedWorkflowId;
    }
    const defaultWf = workflows.find((w) => w.isDefault);
    return defaultWf ? defaultWf.workflowId : workflows[0]?.workflowId || '';
  }, [workflows, selectedWorkflowId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {DASHBOARD_WORKFLOW_COPY.TITLE}
          </CardTitle>
          <CardDescription>
            {DASHBOARD_WORKFLOW_COPY.DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-6 bg-muted rounded-sm animate-pulse" />
          <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (workflows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {DASHBOARD_WORKFLOW_COPY.TITLE}
          </CardTitle>
          <CardDescription>
            {DASHBOARD_WORKFLOW_COPY.DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            {DASHBOARD_WORKFLOW_COPY.NO_WORKFLOWS}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentWorkflow =
    workflows.find((w) => w.workflowId === activeWorkflowId) || workflows[0];
  const workflowTotal = currentWorkflow?.totalTickets || 0;

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <GitBranchIcon className="size-5 text-primary" />
            <CardTitle className="text-lg">
              {DASHBOARD_WORKFLOW_COPY.TITLE}
            </CardTitle>
            {currentWorkflow.isDefault && (
              <Badge variant="outline" className="text-xs">
                {DASHBOARD_WORKFLOW_COPY.DEFAULT_BADGE}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1">
            {DASHBOARD_WORKFLOW_COPY.DESCRIPTION}
          </CardDescription>
        </div>

        {workflows.length > 1 && (
          <div className="w-full sm:w-60">
            <Select
              value={currentWorkflow.workflowId}
              onValueChange={(val) => val && setSelectedWorkflowId(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={DASHBOARD_WORKFLOW_COPY.WORKFLOW_SELECT_LABEL}
                >
                  {(val: string | null) => {
                    const wf = workflows.find((w) => w.workflowId === val);
                    if (!wf) return null;
                    return `${wf.workflowName}${
                      wf.isDefault
                        ? ` (${DASHBOARD_WORKFLOW_COPY.DEFAULT_BADGE})`
                        : ''
                    }`;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workflows.map((wf) => (
                  <SelectItem key={wf.workflowId} value={wf.workflowId}>
                    {wf.workflowName}{' '}
                    {wf.isDefault
                      ? `(${DASHBOARD_WORKFLOW_COPY.DEFAULT_BADGE})`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
          <span className="font-medium text-foreground">
            {currentWorkflow.workflowName}
          </span>
          <span>
            <strong className="text-foreground">{workflowTotal}</strong>{' '}
            {DASHBOARD_WORKFLOW_COPY.TOTAL_WORKFLOW_TICKETS}
          </span>
        </div>

        {workflowTotal === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {DASHBOARD_WORKFLOW_COPY.NO_TICKETS}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentWorkflow.stages.map((stage) => {
              const percentage =
                workflowTotal > 0
                  ? Math.round((stage.count / workflowTotal) * 100)
                  : 0;
              const badgeVariant =
                STATUS_CATEGORY_BADGE_VARIANTS[stage.category] || 'default';
              const categoryLabel =
                STATUS_CATEGORY_LABELS[stage.category] || stage.category;

              return (
                <div
                  key={stage.key}
                  className="rounded-lg border bg-card p-4 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm leading-tight text-foreground">
                        {stage.name}
                      </h4>
                      <Badge
                        variant={badgeVariant}
                        className="text-[10px] mt-1.5 px-1.5 py-0"
                      >
                        {categoryLabel}
                      </Badge>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {stage.count}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{percentage}%</span>
                      <span>{DASHBOARD_WORKFLOW_COPY.STAGE_PERCENTAGE}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
