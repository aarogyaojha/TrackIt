import { TicketStatus } from '@trackit/types';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.RECEIVED]: 'Received',
  [TicketStatus.IN_PROGRESS]: 'In Progress',
  [TicketStatus.READY]: 'Ready',
  [TicketStatus.DELIVERED]: 'Delivered',
  [TicketStatus.CANCELLED]: 'Cancelled',
};

export const TICKET_STATUS_BADGE_VARIANT: Record<
  TicketStatus,
  'secondary' | 'default' | 'warning' | 'success' | 'outline'
> = {
  [TicketStatus.RECEIVED]: 'secondary',
  [TicketStatus.IN_PROGRESS]: 'default',
  [TicketStatus.READY]: 'warning',
  [TicketStatus.DELIVERED]: 'success',
  [TicketStatus.CANCELLED]: 'outline',
};

// Mirrors the backend's authoritative transition map for UX purposes only (limits which next-statuses are offered in the dropdown) — the API enforces the real rule regardless of what this shows. Keep in sync manually; drift here is a UX annoyance, never a safety issue, since the backend is the source of truth.
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.RECEIVED]: [
    TicketStatus.IN_PROGRESS,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.READY,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.READY]: [
    TicketStatus.DELIVERED,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.DELIVERED]: [],
  [TicketStatus.CANCELLED]: [],
};

export const TICKETS_LIST_COPY = {
  TITLE: 'Tickets',
  DESCRIPTION: 'Manage and track customer service items and status tickets.',
  CREATE_BUTTON: 'Create Ticket',
  SEARCH_PLACEHOLDER: 'Search by code or customer name...',
  STATUS_FILTER_ALL: 'All Statuses',
  STATUS_FILTER_LABEL: 'Filter by status',
  TABLE_HEADER_CODE: 'Code',
  TABLE_HEADER_CUSTOMER: 'Customer',
  TABLE_HEADER_ITEM: 'Item Description',
  TABLE_HEADER_STATUS: 'Status',
  TABLE_HEADER_CREATED: 'Created',
  TABLE_HEADER_ACTIONS: 'Actions',
  VIEW_DETAILS_BUTTON: 'View Details',
  EMPTY_STATE_TITLE: 'No tickets found',
  EMPTY_STATE_DESCRIPTION: 'No tickets match your filter criteria. Create a new ticket to get started.',
  PAGINATION_PREVIOUS: 'Previous',
  PAGINATION_NEXT: 'Next',
  PAGINATION_PAGE_INFO: 'Page',
  PAGINATION_OF: 'of',
} as const;

export const CREATE_TICKET_COPY = {
  DIALOG_TITLE: 'Create New Ticket',
  DIALOG_DESCRIPTION: 'Enter customer and item details to generate a tracked service ticket.',
  CODE_LABEL: 'Ticket Code',
  CODE_PLACEHOLDER: 'TIK-1001',
  CUSTOMER_NAME_LABEL: 'Customer Name',
  CUSTOMER_NAME_PLACEHOLDER: 'Jane Smith',
  CUSTOMER_PHONE_LABEL: 'Customer Phone',
  CUSTOMER_PHONE_PLACEHOLDER: '+1 555-0199',
  ITEM_DESCRIPTION_LABEL: 'Item Description',
  ITEM_DESCRIPTION_PLACEHOLDER: 'e.g. 2021 Mountain Bike - Tune up brakes',
  SUBMIT_BUTTON: 'Create Ticket',
  SUBMIT_BUTTON_PENDING: 'Creating...',
  CANCEL_BUTTON: 'Cancel',
  SUCCESS_TITLE: 'Ticket Created',
  SUCCESS_DESCRIPTION: 'Ticket has been created successfully.',
  ERROR_TITLE: 'Ticket Creation Failed',
} as const;

export const TICKET_DETAIL_COPY = {
  BACK_BUTTON: 'Back to Tickets',
  TITLE: 'Ticket Details',
  CODE_PREFIX: 'Ticket',
  STATUS_LABEL: 'Current Status',
  CUSTOMER_SECTION_TITLE: 'Customer Information',
  CUSTOMER_NAME_LABEL: 'Name',
  CUSTOMER_PHONE_LABEL: 'Phone',
  ITEM_SECTION_TITLE: 'Item Details',
  ITEM_DESCRIPTION_LABEL: 'Description',
  PUBLIC_TRACKING_TITLE: 'Public Tracking & QR Code',
  PUBLIC_TRACKING_DESCRIPTION: 'Share this link or QR code with your customer for real-time status tracking without logging in.',
  PUBLIC_URL_LABEL: 'Public Tracking URL',
  COPY_LINK_BUTTON: 'Copy Link',
  LINK_COPIED_TOOLTIP: 'Copied!',
  QR_CODE_ALT: 'Ticket Public Tracking QR Code',
  TIMELINE_TITLE: 'Status History',
  TIMELINE_EMPTY: 'No status changes recorded yet.',
  TIMELINE_CHANGED_BY: 'Changed by',
  UPDATE_STATUS_TITLE: 'Update Ticket Status',
  UPDATE_STATUS_PLACEHOLDER: 'Select new status...',
  UPDATE_STATUS_BUTTON: 'Update Status',
  UPDATE_STATUS_PENDING: 'Updating...',
  UPDATE_STATUS_SUCCESS_TITLE: 'Status Updated',
  UPDATE_STATUS_SUCCESS_DESCRIPTION: 'Ticket status has been successfully updated.',
  UPDATE_STATUS_ERROR_TITLE: 'Status Update Failed',
  FINAL_STATUS_NOTICE: 'This ticket is in a terminal status and cannot be transitioned further.',
  NOT_FOUND_TITLE: 'Ticket Not Found',
  NOT_FOUND_DESCRIPTION: 'The ticket you are looking for does not exist or has been removed.',
  NOT_FOUND_BUTTON: 'Return to Tickets',
} as const;
