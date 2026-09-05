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
} as const;

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
  STATUS_QUERY_DESCRIPTION: 'Filter tickets by status',
} as const;
