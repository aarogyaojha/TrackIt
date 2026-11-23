import * as React from 'react';
import { TicketStatus } from '@trackit/types';
import { Badge } from '@/components/ui/badge';
import {
  TICKET_STATUS_BADGE_VARIANT,
  TICKET_STATUS_LABELS,
} from '../tickets.constants';

export interface StatusBadgeProps {
  status: TicketStatus | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayLabel =
    label ||
    TICKET_STATUS_LABELS[status as TicketStatus] ||
    status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  const variant =
    TICKET_STATUS_BADGE_VARIANT[status as TicketStatus] || 'secondary';

  return (
    <Badge variant={variant} className={className}>
      {displayLabel}
    </Badge>
  );
}
