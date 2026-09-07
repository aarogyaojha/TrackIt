import * as React from 'react';
import { OrgStatus } from '@trackit/types';
import { Badge } from '@/components/ui/badge';
import {
  ORG_STATUS_BADGE_VARIANT,
  ORG_STATUS_LABELS,
} from '../superadmin.constants';

export interface OrgStatusBadgeProps {
  status: OrgStatus;
  className?: string;
}

export function OrgStatusBadge({ status, className }: OrgStatusBadgeProps) {
  const label = ORG_STATUS_LABELS[status] || status;
  const variant = ORG_STATUS_BADGE_VARIANT[status] || 'outline';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
