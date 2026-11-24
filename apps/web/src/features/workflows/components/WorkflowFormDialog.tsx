'use client';

import * as React from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { StatusCategory } from '@trackit/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WorkflowDetail } from '../api/types';
import { useCreateWorkflow } from '../api/useCreateWorkflow';
import { useUpdateWorkflow } from '../api/useUpdateWorkflow';
import { useWorkflow } from '../api/useWorkflow';
import {
  STATUS_CATEGORY_BADGE_VARIANTS,
  STATUS_CATEGORY_LABELS,
  WORKFLOW_FORM_COPY,
} from '../workflows.constants';

export interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId?: string | null;
}

interface FormStatusItem {
  key: string;
  name: string;
  customerLabel: string;
  customerDescription: string;
  category: StatusCategory;
  color: string;
}

const DEFAULT_STAGES: FormStatusItem[] = [
  {
    key: 'received',
    name: 'Received',
    customerLabel: 'Received',
    customerDescription: 'Item has been checked in.',
    category: StatusCategory.INITIAL,
    color: 'secondary',
  },
  {
    key: 'in_progress',
    name: 'In Progress',
    customerLabel: 'In Progress',
    customerDescription: 'Work is currently ongoing.',
    category: StatusCategory.IN_PROGRESS,
    color: 'default',
  },
  {
    key: 'ready',
    name: 'Ready',
    customerLabel: 'Ready for Pickup',
    customerDescription: 'Work is complete and item is ready.',
    category: StatusCategory.READY,
    color: 'warning',
  },
  {
    key: 'delivered',
    name: 'Delivered',
    customerLabel: 'Completed',
    customerDescription: 'Order collected.',
    category: StatusCategory.COMPLETED,
    color: 'success',
  },
  {
    key: 'cancelled',
    name: 'Cancelled',
    customerLabel: 'Cancelled',
    customerDescription: 'Order was cancelled.',
    category: StatusCategory.CANCELLED,
    color: 'outline',
  },
];

interface WorkflowFormInnerProps {
  workflowId?: string | null;
  existingWorkflow?: WorkflowDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

function WorkflowFormInner({
  workflowId,
  existingWorkflow,
  onSuccess,
  onCancel,
}: WorkflowFormInnerProps) {
  const isEditing = Boolean(workflowId);
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow();
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  const isSubmitting = isCreating || isUpdating;

  const [name, setName] = React.useState(existingWorkflow?.name || '');
  const [description, setDescription] = React.useState(
    existingWorkflow?.description || '',
  );
  const [isDefault, setIsDefault] = React.useState(
    existingWorkflow?.isDefault || false,
  );
  const [statuses, setStatuses] = React.useState<FormStatusItem[]>(() => {
    if (existingWorkflow?.statuses && existingWorkflow.statuses.length > 0) {
      return existingWorkflow.statuses.map((s) => ({
        key: s.key,
        name: s.name,
        customerLabel: s.customerLabel || s.name,
        customerDescription: s.customerDescription || '',
        category: s.category,
        color: s.color || 'default',
      }));
    }
    return DEFAULT_STAGES;
  });

  const handleAddStage = () => {
    const nextIdx = statuses.length + 1;
    setStatuses((prev) => [
      ...prev,
      {
        key: `step_${nextIdx}`,
        name: `Step ${nextIdx}`,
        customerLabel: `Step ${nextIdx}`,
        customerDescription: '',
        category: StatusCategory.IN_PROGRESS,
        color: 'default',
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (statuses.length <= 2) {
      toast.error(WORKFLOW_FORM_COPY.MIN_STAGES_ERROR);
      return;
    }
    setStatuses((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= statuses.length) return;

    setStatuses((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
  };

  const handleUpdateStatusField = (
    index: number,
    field: keyof FormStatusItem,
    value: string,
  ) => {
    setStatuses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(WORKFLOW_FORM_COPY.NAME_REQUIRED_ERROR);
      return;
    }

    const keys = statuses.map((s) => s.key.toLowerCase().trim());
    if (new Set(keys).size !== keys.length) {
      toast.error(WORKFLOW_FORM_COPY.UNIQUE_KEYS_ERROR);
      return;
    }

    const hasInitial = statuses.some(
      (s) => s.category === StatusCategory.INITIAL,
    );
    const hasCompleted = statuses.some(
      (s) => s.category === StatusCategory.COMPLETED,
    );

    if (!hasInitial || !hasCompleted) {
      toast.error(WORKFLOW_FORM_COPY.LIFECYCLE_STAGES_ERROR);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      isDefault,
      statuses: statuses.map((s, idx) => ({
        key: s.key.trim().toLowerCase(),
        name: s.name.trim(),
        customerLabel: s.customerLabel.trim() || s.name.trim(),
        customerDescription: s.customerDescription.trim(),
        category: s.category,
        color: s.color,
        order: idx,
      })),
    };

    if (isEditing && workflowId) {
      updateWorkflow(
        { id: workflowId, payload },
        {
          onSuccess: () => {
            toast.success(WORKFLOW_FORM_COPY.UPDATE_SUCCESS);
            onSuccess();
          },
          onError: (err) => {
            toast.error(
              err.response?.data?.error?.message ||
                WORKFLOW_FORM_COPY.UPDATE_ERROR_DEFAULT,
            );
          },
        },
      );
    } else {
      createWorkflow(payload, {
        onSuccess: () => {
          toast.success(WORKFLOW_FORM_COPY.CREATE_SUCCESS);
          onSuccess();
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.error?.message ||
              WORKFLOW_FORM_COPY.CREATE_ERROR_DEFAULT,
          );
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wf-name" className="text-sm font-medium">
            {WORKFLOW_FORM_COPY.NAME_LABEL}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="wf-name"
            placeholder={WORKFLOW_FORM_COPY.NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-9"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wf-desc" className="text-sm font-medium">
            {WORKFLOW_FORM_COPY.DESCRIPTION_LABEL}
          </Label>
          <Input
            id="wf-desc"
            placeholder={WORKFLOW_FORM_COPY.DESCRIPTION_PLACEHOLDER}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4 sm:col-span-2">
          <div className="space-y-0.5">
            <Label
              htmlFor="wf-default"
              className="text-sm font-medium cursor-pointer"
            >
              {WORKFLOW_FORM_COPY.IS_DEFAULT_LABEL}
            </Label>
            <p className="text-xs text-muted-foreground">
              {WORKFLOW_FORM_COPY.IS_DEFAULT_HINT}
            </p>
          </div>
          <Switch
            id="wf-default"
            checked={isDefault}
            onCheckedChange={setIsDefault}
          />
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {WORKFLOW_FORM_COPY.STAGES_HEADING}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {WORKFLOW_FORM_COPY.STAGES_DESCRIPTION}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStage}
            className="gap-1.5 shrink-0"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {WORKFLOW_FORM_COPY.ADD_STAGE_BUTTON}
          </Button>
        </div>

        <div className="space-y-3.5">
          {statuses.map((status, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card/60 p-4 space-y-3.5 shadow-xs transition-colors hover:border-foreground/20"
            >
              {/* Stage Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {status.name.trim() ||
                      `${WORKFLOW_FORM_COPY.UNTITLED_STAGE} ${index + 1}`}
                  </span>
                  <Badge
                    variant={STATUS_CATEGORY_BADGE_VARIANTS[status.category]}
                    className="text-[10px] px-2 py-0.5 font-medium"
                  >
                    {STATUS_CATEGORY_LABELS[status.category]}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveStage(index, 'up')}
                    disabled={index === 0}
                    title={WORKFLOW_FORM_COPY.MOVE_UP}
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveStage(index, 'down')}
                    disabled={index === statuses.length - 1}
                    title={WORKFLOW_FORM_COPY.MOVE_DOWN}
                  >
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveStage(index)}
                    title={WORKFLOW_FORM_COPY.REMOVE_STAGE}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Internal / Lifecycle Configuration */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {WORKFLOW_FORM_COPY.STAGE_NAME_LABEL}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={WORKFLOW_FORM_COPY.STAGE_NAME_PLACEHOLDER}
                    value={status.name}
                    onChange={(e) =>
                      handleUpdateStatusField(index, 'name', e.target.value)
                    }
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {WORKFLOW_FORM_COPY.STAGE_KEY_LABEL}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={WORKFLOW_FORM_COPY.STAGE_KEY_PLACEHOLDER}
                    value={status.key}
                    onChange={(e) =>
                      handleUpdateStatusField(index, 'key', e.target.value)
                    }
                    className="h-9 text-sm font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {WORKFLOW_FORM_COPY.STAGE_CATEGORY_LABEL}
                  </Label>
                  <Select
                    value={status.category}
                    onValueChange={(val) =>
                      handleUpdateStatusField(
                        index,
                        'category',
                        val as StatusCategory,
                      )
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue>
                        {(val: string | null) =>
                          val
                            ? STATUS_CATEGORY_LABELS[val as StatusCategory] ||
                              val
                            : null
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(StatusCategory).map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {STATUS_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Portal Display */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-border/30">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {WORKFLOW_FORM_COPY.STAGE_CUSTOMER_LABEL}
                  </Label>
                  <Input
                    placeholder={
                      WORKFLOW_FORM_COPY.STAGE_CUSTOMER_LABEL_PLACEHOLDER
                    }
                    value={status.customerLabel}
                    onChange={(e) =>
                      handleUpdateStatusField(
                        index,
                        'customerLabel',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {WORKFLOW_FORM_COPY.STAGE_CUSTOMER_DESC}
                  </Label>
                  <Input
                    placeholder={
                      WORKFLOW_FORM_COPY.STAGE_CUSTOMER_DESC_PLACEHOLDER
                    }
                    value={status.customerDescription}
                    onChange={(e) =>
                      handleUpdateStatusField(
                        index,
                        'customerDescription',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Add Stage button for easy access */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStage}
            className="w-full border-dashed py-4 gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/40"
          >
            <PlusIcon className="h-4 w-4" />
            {WORKFLOW_FORM_COPY.ADD_STAGE_BUTTON}
          </Button>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {WORKFLOW_FORM_COPY.CANCEL}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? WORKFLOW_FORM_COPY.SUBMIT_SAVING
            : isEditing
              ? WORKFLOW_FORM_COPY.SUBMIT_UPDATE
              : WORKFLOW_FORM_COPY.SUBMIT_CREATE}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function WorkflowFormDialog({
  open,
  onOpenChange,
  workflowId,
}: WorkflowFormDialogProps) {
  const isEditing = Boolean(workflowId);
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } =
    useWorkflow(workflowId || undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[88vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? WORKFLOW_FORM_COPY.EDIT_TITLE
              : WORKFLOW_FORM_COPY.CREATE_TITLE}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? WORKFLOW_FORM_COPY.EDIT_DESCRIPTION
              : WORKFLOW_FORM_COPY.CREATE_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingWorkflow ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {WORKFLOW_FORM_COPY.LOADING_DETAILS}
          </div>
        ) : (
          <WorkflowFormInner
            key={workflowId || 'create-new'}
            workflowId={workflowId}
            existingWorkflow={existingWorkflow}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
