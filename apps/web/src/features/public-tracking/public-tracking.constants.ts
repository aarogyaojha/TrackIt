import { TicketStatus } from '@trackit/types';
import { TICKET_STATUS_LABELS } from '@/features/tickets/tickets.constants';

export { TICKET_STATUS_LABELS };

export const PUBLIC_STEPPER_STATUSES = [
  TicketStatus.RECEIVED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.READY,
  TicketStatus.DELIVERED,
] as const;

export const PUBLIC_TRACKING_COPY = {
  PAGE_TITLE_SUFFIX: 'Ticket Status Tracker',
  PAGE_TITLE_FORMAT: (orgName: string) => `${orgName} | Ticket Status`,
  TICKET_CODE_LABEL: 'Ticket Code',
  CUSTOMER_LABEL: 'Customer',
  ITEM_LABEL: 'Item Description',
  CREATED_LABEL: 'Created',
  STATUS_TIMELINE_TITLE: 'Status History',
  TIMELINE_EMPTY: 'No history records available.',
  FOOTER_ATTRIBUTION_PREFIX: 'Powered by',
  FOOTER_ATTRIBUTION_BRAND: 'TrackIt',
  FOOTER_ATTRIBUTION: 'Powered by TrackIt',
  CANCELLED_TITLE: 'Ticket Cancelled',
  CANCELLED_DESCRIPTION:
    'This service ticket has been marked as cancelled. Please contact the business directly if you have questions or require further assistance.',
  NOT_FOUND_TITLE: 'Ticket Not Found',
  NOT_FOUND_DESCRIPTION:
    'We could not find a ticket with this code. Please verify the URL or contact the business directly for assistance.',
  RATE_LIMITED_TITLE: 'Too Many Requests',
  RATE_LIMITED_DESCRIPTION:
    'You have made too many requests in a short period. Please wait a moment before trying again.',
  LOADING_TITLE: 'Loading ticket status...',
  LIVE_UPDATE_BADGE: 'Live Tracking',
} as const;
