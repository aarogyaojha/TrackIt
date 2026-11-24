'use client';

import * as React from 'react';
import { StatusCategory, TicketStatus } from '@trackit/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorCode } from '@/constants/error-codes';
import { ErrorMessages } from '@/constants/error-messages';
import { useWorkflow } from '@/features/workflows/api/useWorkflow';
import { useUpdateTicketStatus } from '../api/useUpdateTicketStatus';
import {
  TICKET_DETAIL_COPY,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TRANSITIONS,
} from '../tickets.constants';

export interface StatusUpdateControlProps {
  ticketId: string;
  currentStatus: TicketStatus | string;
  workflowId?: string;
}

export function StatusUpdateControl({
  ticketId,
  currentStatus,
  workflowId,
}: StatusUpdateControlProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const { mutate: updateStatus, isPending } = useUpdateTicketStatus();
  const { data: workflow } = useWorkflow(workflowId);

  // Compute allowed transitions
  const allowedOptions: Array<{ value: string; label: string }> =
    React.useMemo(() => {
      if (workflow?.statuses && workflow.statuses.length > 0) {
        const sorted = [...workflow.statuses].sort((a, b) => a.order - b.order);
        const currentItem = sorted.find(
          (s) => s.key.toLowerCase() === (currentStatus as string).toLowerCase(),
        );

        if (!currentItem) {
          // If current status not in workflow, allow moving to first step
          return sorted.slice(0, 1).map((s) => ({ value: s.key, label: s.name }));
        }

        // Terminal states cannot transition further
        if (
          currentItem.category === StatusCategory.COMPLETED ||
          currentItem.category === StatusCategory.CANCELLED
        ) {
          return [];
        }

        const currentIdx = sorted.findIndex(
          (s) => s.key.toLowerCase() === currentItem.key.toLowerCase(),
        );
        const nextStep =
          currentIdx >= 0 && currentIdx < sorted.length - 1
            ? sorted[currentIdx + 1]
            : null;
        const cancelledStep = sorted.find(
          (s) => s.category === StatusCategory.CANCELLED,
        );

        const options: Array<{ value: string; label: string }> = [];
        if (nextStep) {
          options.push({ value: nextStep.key, label: nextStep.name });
        }
        if (cancelledStep && cancelledStep.key !== nextStep?.key) {
          options.push({ value: cancelledStep.key, label: cancelledStep.name });
        }
        return options;
      }

      // Legacy fallback
      const legacyAllowed =
        TICKET_STATUS_TRANSITIONS[currentStatus as TicketStatus] || [];
      return legacyAllowed.map((st) => ({
        value: st,
        label: TICKET_STATUS_LABELS[st] || st,
      }));
    }, [workflow, currentStatus]);

  const handleUpdate = () => {
    if (!selectedStatus) return;

    updateStatus(
      { id: ticketId, status: selectedStatus },
      {
        onSuccess: (updated) => {
          const updatedName =
            workflow?.statuses?.find(
              (s) => s.key.toLowerCase() === updated.status.toLowerCase(),
            )?.name ||
            TICKET_STATUS_LABELS[updated.status as TicketStatus] ||
            updated.status;

          toast.success(TICKET_DETAIL_COPY.UPDATE_STATUS_SUCCESS_TITLE, {
            description: `Status updated to ${updatedName}.`,
          });
          setSelectedStatus('');
        },
        onError: (error) => {
          const errorCode = error.response?.data?.error?.code;
          if (errorCode === ErrorCode.INVALID_STATUS_TRANSITION) {
            toast.error(TICKET_DETAIL_COPY.UPDATE_STATUS_ERROR_TITLE, {
              description: ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
            });
          } else {
            toast.error(TICKET_DETAIL_COPY.UPDATE_STATUS_ERROR_TITLE, {
              description:
                error.response?.data?.error?.message ||
                'Failed to update status. Please try again.',
            });
          }
        },
      },
    );
  };

  if (allowedOptions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        {TICKET_DETAIL_COPY.FINAL_STATUS_NOTICE}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="w-full sm:w-56">
        <Select
          value={selectedStatus || undefined}
          onValueChange={(val) => setSelectedStatus((val as string) || '')}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={TICKET_DETAIL_COPY.UPDATE_STATUS_PLACEHOLDER}
            >
              {(val: string | null) => {
                const opt = allowedOptions.find((o) => o.value === val);
                return opt ? opt.label : val;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allowedOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={handleUpdate}
        disabled={!selectedStatus || isPending}
      >
        {isPending
          ? TICKET_DETAIL_COPY.UPDATE_STATUS_PENDING
          : TICKET_DETAIL_COPY.UPDATE_STATUS_BUTTON}
      </Button>
    </div>
  );
}

