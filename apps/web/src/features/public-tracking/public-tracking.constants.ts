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
  DETAILS_TITLE: 'Service Details',
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

export const ORG_PORTAL_COPY = {
  BADGE: 'Live Status Portal',
  SUBHEADING: 'Track your item and service progress in real time.',
  SEARCH_CARD_TITLE: 'Track Your Item',
  SEARCH_CARD_DESC: 'Enter your Ticket Code or phone number to view live status.',
  INPUT_LABEL: 'Ticket Code or Phone Number',
  INPUT_PLACEHOLDER: 'e.g. TK-AB12CD or 555-0199',
  SEARCH_BUTTON: 'Track Status',
  SEARCHING_BUTTON: 'Searching...',
  HINT: 'Your ticket code is printed on your receipt or was provided by staff upon check-in.',
  DIRECT_LINK_LABEL: 'Shareable Ticket Link',
  COPY_LINK_BUTTON: 'Copy Link',
  LINK_COPIED: 'Link copied to clipboard',
  VIEW_DIRECT_PAGE: 'Open Dedicated Tracking Page',
  NOT_FOUND_TITLE: 'No Tickets Found',
  NOT_FOUND_DESC: 'We could not find an active ticket matching that code or phone number. Please check your details or contact the business.',
  MULTIPLE_RESULTS_TITLE: 'Matching Tickets',
  MULTIPLE_RESULTS_DESC: 'We found multiple tickets matching your search. Select one to view its status:',
  VIEW_STATUS_BUTTON: 'View Status',
} as const;
