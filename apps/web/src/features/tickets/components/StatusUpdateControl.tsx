'use client';

import * as React from 'react';
import { TicketStatus } from '@trackit/types';
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
import { useUpdateTicketStatus } from '../api/useUpdateTicketStatus';
import {
  TICKET_DETAIL_COPY,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TRANSITIONS,
} from '../tickets.constants';

export interface StatusUpdateControlProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

export function StatusUpdateControl({
  ticketId,
  currentStatus,
}: StatusUpdateControlProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const { mutate: updateStatus, isPending } = useUpdateTicketStatus();

  const allowedTransitions = TICKET_STATUS_TRANSITIONS[currentStatus] || [];

  const handleUpdate = () => {
    if (!selectedStatus) return;

    updateStatus(
      { id: ticketId, status: selectedStatus as TicketStatus },
      {
        onSuccess: (updated) => {
          toast.success(TICKET_DETAIL_COPY.UPDATE_STATUS_SUCCESS_TITLE, {
            description: `Status updated to ${TICKET_STATUS_LABELS[updated.status]}.`,
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

  if (allowedTransitions.length === 0) {
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
            />
          </SelectTrigger>
          <SelectContent>
            {allowedTransitions.map((st) => (
              <SelectItem key={st} value={st}>
                {TICKET_STATUS_LABELS[st]}
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
