import { Permission } from '@trackit/types';

export const ROLES_SWAGGER = {
  TAG: 'Roles & Permissions',
  LIST_SUMMARY: 'List all available roles',
  LIST_DESCRIPTION:
    'Retrieve all system default roles and custom organization roles with their assigned granular permissions.',
  LIST_OK_DESCRIPTION: 'Roles list successfully retrieved',

  GET_BY_ID_SUMMARY: 'Get role by ID',
  GET_BY_ID_DESCRIPTION: 'Retrieve details and permissions for a specific role.',
  GET_BY_ID_OK_DESCRIPTION: 'Role details successfully retrieved',

  CREATE_SUMMARY: 'Create a new custom role',
  CREATE_DESCRIPTION:
    'Platform superadmin creates a new role with custom assigned permissions.',
  CREATE_CREATED_DESCRIPTION: 'Custom role successfully created',

  UPDATE_SUMMARY: 'Update custom role',
  UPDATE_DESCRIPTION:
    'Platform superadmin updates the name, description, or permissions of an existing custom role.',
  UPDATE_OK_DESCRIPTION: 'Role successfully updated',

  DELETE_SUMMARY: 'Delete custom role',
  DELETE_DESCRIPTION:
    'Platform superadmin deletes a custom role. System default roles cannot be deleted.',
  DELETE_OK_DESCRIPTION: 'Custom role successfully deleted',
} as const;

export interface SystemRoleDefinition {
  name: string;
  key: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export const SYSTEM_DEFAULT_ROLES: SystemRoleDefinition[] = [
  {
    name: 'Superadmin',
    key: 'SUPERADMIN',
    description:
      'Full platform-wide superadmin access with all permissions across all organizations and system settings.',
    permissions: [Permission.PLATFORM_ALL],
    isSystem: true,
  },
  {
    name: 'Organization Admin',
    key: 'ORG_ADMIN',
    description:
      'Full administrative control over the organization, including tickets, custom workflows, team members, and settings.',
    permissions: [
      Permission.TICKETS_CREATE,
      Permission.TICKETS_READ,
      Permission.TICKETS_UPDATE,
      Permission.TICKETS_UPDATE_STATUS,
      Permission.TICKETS_DELETE,
      Permission.WORKFLOWS_CREATE,
      Permission.WORKFLOWS_READ,
      Permission.WORKFLOWS_UPDATE,
      Permission.WORKFLOWS_DELETE,
      Permission.USERS_CREATE,
      Permission.USERS_READ,
      Permission.USERS_UPDATE,
      Permission.USERS_DELETE,
      Permission.ORG_READ,
      Permission.ORG_UPDATE,
      Permission.ORG_QR_VIEW,
      Permission.SUBSCRIPTION_READ,
      Permission.ROLES_READ,
    ],
    isSystem: true,
  },
  {
    name: 'Organization Staff',
    key: 'ORG_STAFF',
    description:
      'Standard operational access to create customer tickets, update progress stages, view workflows, and access counter QR codes.',
    permissions: [
      Permission.TICKETS_CREATE,
      Permission.TICKETS_READ,
      Permission.TICKETS_UPDATE_STATUS,
      Permission.WORKFLOWS_READ,
      Permission.ORG_QR_VIEW,
    ],
    isSystem: true,
  },
];
