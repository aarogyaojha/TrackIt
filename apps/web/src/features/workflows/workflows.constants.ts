import { StatusCategory } from '@trackit/types';

export const WORKFLOWS_PAGE_COPY = {
  PAGE_TITLE: 'Workflows',
  PAGE_DESCRIPTION:
    'Customize how tickets progress through your business with custom statuses and customer tracking stages.',
  CREATE_BUTTON: 'Create Workflow',
  EMPTY_TITLE: 'No workflows found',
  EMPTY_DESCRIPTION:
    'Create your first custom workflow or customize the default service workflow.',
  DEFAULT_BADGE: 'Default',
  ACTIVE_BADGE: 'Active',
  INACTIVE_BADGE: 'Inactive',
  ERROR_MESSAGE: 'Failed to load workflows. Please refresh or try again later.',
} as const;

export const WORKFLOW_TABLE_HEADERS = {
  NAME: 'Workflow Name',
  DESCRIPTION: 'Description',
  STATUS_COUNT: 'Stages',
  IS_DEFAULT: 'Default',
  STATUS: 'Status',
  ACTIONS: 'Actions',
  EDIT_ACTION: 'Edit workflow',
  DELETE_ACTION: 'Delete workflow',
} as const;

export const WORKFLOW_FORM_COPY = {
  CREATE_TITLE: 'Create Custom Workflow',
  CREATE_DESCRIPTION:
    'Define an ordered sequence of stages for customer items in this workflow.',
  EDIT_TITLE: 'Edit Workflow',
  EDIT_DESCRIPTION: 'Update workflow details, status stages, or default setting.',
  NAME_LABEL: 'Workflow Name',
  NAME_PLACEHOLDER: 'e.g. Express Alterations, Diagnostics & Repair',
  DESCRIPTION_LABEL: 'Description (Optional)',
  DESCRIPTION_PLACEHOLDER: 'Briefly explain what tickets should use this workflow',
  IS_DEFAULT_LABEL: 'Set as Default Workflow',
  IS_DEFAULT_HINT: 'New tickets will use this workflow automatically unless another is selected.',
  STAGES_HEADING: 'Workflow Stages',
  STAGES_DESCRIPTION:
    'Add and order the statuses a ticket will go through. Must have at least one Initial stage and one Completed stage.',
  ADD_STAGE_BUTTON: 'Add Stage',
  SUBMIT_CREATE: 'Create Workflow',
  SUBMIT_UPDATE: 'Save Changes',
  SUBMIT_SAVING: 'Saving...',
  LOADING_DETAILS: 'Loading workflow details...',
  CANCEL: 'Cancel',
  STAGE_NAME_LABEL: 'Internal Stage Name',
  STAGE_NAME_PLACEHOLDER: 'e.g. Received, In Diagnosis',
  STAGE_KEY_LABEL: 'Key (Slug)',
  STAGE_KEY_PLACEHOLDER: 'e.g. received',
  STAGE_CATEGORY_LABEL: 'Lifecycle Category',
  STAGE_CUSTOMER_LABEL: 'Customer Label',
  STAGE_CUSTOMER_LABEL_PLACEHOLDER: 'e.g. Item Received',
  STAGE_CUSTOMER_DESC: 'Customer Description',
  STAGE_CUSTOMER_DESC_PLACEHOLDER: 'e.g. Item has been checked in and queued for review.',
  UNTITLED_STAGE: 'Stage',
  MOVE_UP: 'Move Up',
  MOVE_DOWN: 'Move Down',
  REMOVE_STAGE: 'Remove',
  MIN_STAGES_ERROR: 'Workflow must have at least 2 stages',
  NAME_REQUIRED_ERROR: 'Workflow name is required',
  UNIQUE_KEYS_ERROR: 'All stage keys must be unique',
  LIFECYCLE_STAGES_ERROR:
    'Workflow must contain at least one Initial stage and one Completed stage',
  CREATE_SUCCESS: 'Workflow created successfully',
  CREATE_ERROR_DEFAULT: 'Failed to create workflow',
  UPDATE_SUCCESS: 'Workflow updated successfully',
  UPDATE_ERROR_DEFAULT: 'Failed to update workflow',
} as const;

export const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  [StatusCategory.INITIAL]: 'Initial / Intake',
  [StatusCategory.IN_PROGRESS]: 'In Progress',
  [StatusCategory.READY]: 'Ready for Customer',
  [StatusCategory.COMPLETED]: 'Completed / Delivered',
  [StatusCategory.CANCELLED]: 'Cancelled',
};

export const STATUS_CATEGORY_BADGE_VARIANTS: Record<
  StatusCategory,
  'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  [StatusCategory.INITIAL]: 'secondary',
  [StatusCategory.IN_PROGRESS]: 'default',
  [StatusCategory.READY]: 'warning',
  [StatusCategory.COMPLETED]: 'success',
  [StatusCategory.CANCELLED]: 'destructive',
};

export const WORKFLOW_DELETE_CONFIRM = {
  TITLE: 'Delete Workflow?',
  DESCRIPTION:
    'This workflow will be permanently removed. You cannot delete a workflow that is set as default or currently assigned to active tickets.',
  CONFIRM_BUTTON: 'Delete',
  CANCEL_BUTTON: 'Cancel',
  DELETE_SUCCESS: 'Workflow deleted successfully',
  DELETE_ERROR_DEFAULT: 'Failed to delete workflow',
} as const;

