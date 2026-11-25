import { TicketStatus } from '@trackit/types';

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

export const ACTIVE_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.RECEIVED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.READY,
];

export const TICKETS_SWAGGER = {
  TAG: 'Tickets',
  PUBLIC_TAG: 'Public Tickets',
  CREATE_SUMMARY: 'Create a new ticket',
  CREATE_DESCRIPTION:
    'Creates a new tracking ticket for a customer item within the tenant organization.',
  CREATE_CREATED_DESCRIPTION: 'Ticket created successfully.',
  LIST_SUMMARY: 'List organization tickets',
  LIST_DESCRIPTION:
    'Retrieves a paginated list of tickets for the authenticated tenant with optional status and search filters.',
  LIST_OK_DESCRIPTION: 'Paginated list of tickets retrieved successfully.',
  GET_BY_ID_SUMMARY: 'Get ticket by ID',
  GET_BY_ID_DESCRIPTION:
    'Fetches details of a specific ticket within the authenticated organization.',
  GET_BY_ID_OK_DESCRIPTION: 'Ticket details retrieved successfully.',
  UPDATE_STATUS_SUMMARY: 'Update ticket status',
  UPDATE_STATUS_DESCRIPTION:
    'Transitions a ticket to a new status following strict lifecycle rules.',
  UPDATE_STATUS_OK_DESCRIPTION: 'Ticket status updated successfully.',
  GET_PUBLIC_SUMMARY: 'Get public ticket status by org slug and code',
  GET_PUBLIC_DESCRIPTION:
    'Fetches customer-facing status and progress history for a ticket without requiring authentication.',
  GET_PUBLIC_OK_DESCRIPTION: 'Public ticket details retrieved successfully.',
  GET_PUBLIC_INTAKE_SUMMARY:
    'Get organization public check-in info and active workflows',
  GET_PUBLIC_INTAKE_DESCRIPTION:
    'Retrieves public information and active workflows for an organization to display on the customer self-check-in portal.',
  GET_PUBLIC_INTAKE_OK_DESCRIPTION:
    'Organization public check-in info retrieved successfully.',
  CREATE_PUBLIC_SUMMARY: 'Submit customer self-check-in ticket',
  CREATE_PUBLIC_DESCRIPTION:
    'Creates a new ticket initiated by a customer through the public intake portal, automatically assigning a unique ticket code.',
  CREATE_PUBLIC_CREATED_DESCRIPTION:
    'Customer ticket created successfully.',
  GET_PUBLIC_INFO_SUMMARY: 'Get organization public portal information',
  GET_PUBLIC_INFO_DESCRIPTION:
    'Retrieves public organization name and slug for the public tracking portal.',
  GET_PUBLIC_INFO_OK_DESCRIPTION:
    'Organization public portal information retrieved successfully.',
  LOOKUP_PUBLIC_SUMMARY: 'Look up live tickets by ticket code or customer phone',
  LOOKUP_PUBLIC_DESCRIPTION:
    'Searches for customer tickets by code or phone number and returns sanitized public tracking details.',
  LOOKUP_PUBLIC_OK_DESCRIPTION:
    'Matching public tickets retrieved successfully.',
  STATS_SUMMARY: 'Get organization ticket dashboard statistics',
  STATS_DESCRIPTION:
    'Retrieves comprehensive ticket metrics, stage breakdown across workflows, staff member performance, and recent activity for the organization dashboard.',
  STATS_OK_DESCRIPTION: 'Ticket dashboard statistics retrieved successfully.',
} as const;

export const MIN_CUSTOMER_NAME_LENGTH = 2;
export const MAX_CUSTOMER_NAME_LENGTH = 100;
export const MAX_ITEM_DESCRIPTION_LENGTH = 500;

/**
 * Permissive phone-shaped regex allowing digits, spaces, dashes, parentheses, and optional leading +.
 * Manually synced with frontend create-ticket.schema.ts.
 */
export const PHONE_NUMBER_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;
export const PHONE_NUMBER_PATTERN_MESSAGE =
  'Please enter a valid phone number (7-20 digits, spaces, dashes, or parentheses)';

export const TICKETS_DTO_SWAGGER = {
  CODE_DESCRIPTION: 'Unique ticket identifier code within the organization',
  CODE_EXAMPLE: 'TICK-1001',
  CUSTOMER_NAME_DESCRIPTION: 'Full name of the customer',
  CUSTOMER_NAME_EXAMPLE: 'Jane Smith',
  CUSTOMER_PHONE_DESCRIPTION: 'Contact phone number of the customer',
  CUSTOMER_PHONE_EXAMPLE: '+15551234567',
  ITEM_DESCRIPTION_DESCRIPTION: 'Description of the item being serviced',
  ITEM_DESCRIPTION_EXAMPLE: '2021 Trek Mountain Bike - Brake Tune-up',
  STATUS_DESCRIPTION: 'Current status of the ticket',
  STATUS_EXAMPLE: TicketStatus.IN_PROGRESS,
  SEARCH_QUERY_DESCRIPTION: 'Search tickets by code or customer name',
  LOOKUP_QUERY_DESCRIPTION: 'Ticket code or customer phone number to look up',
  STATUS_QUERY_DESCRIPTION: 'Filter tickets by status',
  WORKFLOW_ID_DESCRIPTION:
    'Optional ID of the workflow defining the status lifecycle for this ticket',
  WORKFLOW_ID_EXAMPLE: '60c72b2f9b1d8b2bad8e8910',
} as const;
