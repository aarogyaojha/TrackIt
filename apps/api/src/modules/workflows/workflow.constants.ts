import { StatusCategory, TicketStatus } from '@trackit/types';

export const MIN_WORKFLOW_NAME_LENGTH = 2;
export const MAX_WORKFLOW_NAME_LENGTH = 100;
export const MAX_WORKFLOW_DESCRIPTION_LENGTH = 500;
export const MIN_STATUS_KEY_LENGTH = 2;
export const MAX_STATUS_KEY_LENGTH = 50;
export const MIN_STATUS_NAME_LENGTH = 1;
export const MAX_STATUS_NAME_LENGTH = 60;
export const MAX_WORKFLOW_STATUSES = 12;
export const STATUS_KEY_REGEX = /^[a-zA-Z0-9_-]+$/;

export const DEFAULT_WORKFLOW_NAME = 'Standard Service';
export const DEFAULT_WORKFLOW_DESCRIPTION =
  'Default service tracking workflow for repair, maintenance, and custom orders.';

export const DEFAULT_WORKFLOW_STATUSES = [
  {
    key: TicketStatus.RECEIVED,
    name: 'Received',
    customerLabel: 'Received',
    customerDescription: 'Your item has been received and checked into our system.',
    category: StatusCategory.INITIAL,
    color: 'secondary',
    order: 0,
  },
  {
    key: TicketStatus.IN_PROGRESS,
    name: 'In Progress',
    customerLabel: 'In Progress',
    customerDescription: 'Our team is actively working on your item.',
    category: StatusCategory.IN_PROGRESS,
    color: 'default',
    order: 1,
  },
  {
    key: TicketStatus.READY,
    name: 'Ready',
    customerLabel: 'Ready for Pickup',
    customerDescription: 'Work is complete. Your item is ready for collection or delivery.',
    category: StatusCategory.READY,
    color: 'warning',
    order: 2,
  },
  {
    key: TicketStatus.DELIVERED,
    name: 'Delivered',
    customerLabel: 'Delivered / Completed',
    customerDescription: 'The order has been completed and returned.',
    category: StatusCategory.COMPLETED,
    color: 'success',
    order: 3,
  },
  {
    key: TicketStatus.CANCELLED,
    name: 'Cancelled',
    customerLabel: 'Cancelled',
    customerDescription: 'This service request was cancelled.',
    category: StatusCategory.CANCELLED,
    color: 'outline',
    order: 4,
  },
] as const;

export const WORKFLOWS_SWAGGER = {
  TAG: 'Workflows',
  CREATE_SUMMARY: 'Create a new workflow',
  CREATE_DESCRIPTION:
    'Creates a custom workflow with ordered statuses for ticket tracking within the organization.',
  CREATE_CREATED_DESCRIPTION: 'Workflow created successfully.',
  LIST_SUMMARY: 'List organization workflows',
  LIST_DESCRIPTION:
    'Retrieves all configured workflows for the authenticated organization.',
  LIST_OK_DESCRIPTION: 'List of organization workflows retrieved successfully.',
  GET_BY_ID_SUMMARY: 'Get workflow by ID',
  GET_BY_ID_DESCRIPTION:
    'Fetches full workflow details including statuses and configuration by its ID.',
  GET_BY_ID_OK_DESCRIPTION: 'Workflow details retrieved successfully.',
  UPDATE_SUMMARY: 'Update an existing workflow',
  UPDATE_DESCRIPTION:
    'Modifies workflow attributes, status definitions, or default designation.',
  UPDATE_OK_DESCRIPTION: 'Workflow updated successfully.',
  DELETE_SUMMARY: 'Delete a workflow',
  DELETE_DESCRIPTION:
    'Deletes a workflow provided it is not the default workflow and has no associated tickets.',
  DELETE_OK_DESCRIPTION: 'Workflow deleted successfully.',
} as const;
