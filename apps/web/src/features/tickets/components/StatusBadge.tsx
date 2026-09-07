import * as React from 'react';
import { TicketStatus } from '@trackit/types';
import { Badge } from '@/components/ui/badge';
import {
  TICKET_STATUS_BADGE_VARIANT,
  TICKET_STATUS_LABELS,
} from '../tickets.constants';

export interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = TICKET_STATUS_LABELS[status] || status;
  const variant = TICKET_STATUS_BADGE_VARIANT[status] || 'secondary';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
