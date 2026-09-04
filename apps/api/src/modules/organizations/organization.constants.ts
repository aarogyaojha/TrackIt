export const ORGANIZATIONS_SWAGGER = {
  TAG: 'Organizations',
  REGISTER_SUMMARY: 'Register a new organization and admin user',
  REGISTER_DESCRIPTION:
    'Creates a new organization with a default status based on platform approval settings and registers the initial organization admin user.',
  REGISTER_CREATED_DESCRIPTION:
    'Organization and admin account registered successfully.',
  GET_ME_SUMMARY: 'Get the current user organization details',
  GET_ME_DESCRIPTION:
    'Fetches the organization record for the authenticated tenant user.',
  GET_ME_OK_DESCRIPTION: 'Organization profile fetched successfully.',
  LIST_SUMMARY: 'List all organizations (Superadmin only)',
  LIST_DESCRIPTION:
    'Retrieves a paginated list of organizations with optional status filtering.',
  LIST_OK_DESCRIPTION: 'Paginated list of organizations retrieved successfully.',
  GET_BY_ID_SUMMARY: 'Get organization by ID (Superadmin only)',
  GET_BY_ID_DESCRIPTION: 'Fetches details of a specific organization by its ID.',
  GET_BY_ID_OK_DESCRIPTION: 'Organization details retrieved successfully.',
  APPROVE_SUMMARY: 'Approve a pending organization (Superadmin only)',
  APPROVE_DESCRIPTION:
    'Transitions an organization status from PENDING to ACTIVE.',
  APPROVE_OK_DESCRIPTION: 'Organization approved successfully.',
  REJECT_SUMMARY: 'Reject a pending organization (Superadmin only)',
  REJECT_DESCRIPTION:
    'Transitions an organization status from PENDING to REJECTED.',
  REJECT_OK_DESCRIPTION: 'Organization rejected successfully.',
  SUSPEND_SUMMARY: 'Suspend an active organization (Superadmin only)',
  SUSPEND_DESCRIPTION:
    'Transitions an organization status from ACTIVE to SUSPENDED.',
  SUSPEND_OK_DESCRIPTION: 'Organization suspended successfully.',
  REACTIVATE_SUMMARY: 'Reactivate a suspended organization (Superadmin only)',
  REACTIVATE_DESCRIPTION:
    'Transitions an organization status from SUSPENDED to ACTIVE.',
  REACTIVATE_OK_DESCRIPTION: 'Organization reactivated successfully.',
  LIST_QUERY_STATUS_DESCRIPTION: 'Optional status filter for listing organizations',
} as const;

export const MAX_SLUG_RETRIES = 5;
export const MIN_PASSWORD_LENGTH = 8;

export const REGISTER_ORG_DTO_SWAGGER = {
  ORG_NAME_DESCRIPTION: 'Name of the organization',
  ORG_NAME_EXAMPLE: 'Apex Auto Repair',
  ADMIN_NAME_DESCRIPTION: 'Full name of the primary organization admin',
  ADMIN_NAME_EXAMPLE: 'John Doe',
  ADMIN_EMAIL_DESCRIPTION: 'Email address of the organization admin',
  ADMIN_EMAIL_EXAMPLE: 'admin@apexauto.com',
  ADMIN_PASSWORD_DESCRIPTION:
    'Admin password (at least 8 characters long)',
  ADMIN_PASSWORD_EXAMPLE: 'SuperSecret123!',
} as const;
