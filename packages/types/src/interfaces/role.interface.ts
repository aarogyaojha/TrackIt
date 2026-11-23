import { Permission } from '../enums/permission.enum';

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  category: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Tickets',
    permissions: [
      {
        key: Permission.TICKETS_CREATE,
        label: 'Create Tickets',
        description: 'Log new customer service items and generate tickets',
      },
      {
        key: Permission.TICKETS_READ,
        label: 'View Tickets',
        description: 'Search, filter, and view customer service tickets',
      },
      {
        key: Permission.TICKETS_UPDATE,
        label: 'Edit Ticket Details',
        description: 'Update customer information and item service descriptions',
      },
      {
        key: Permission.TICKETS_UPDATE_STATUS,
        label: 'Update Ticket Status',
        description: 'Advance tickets through workflow progress stages',
      },
      {
        key: Permission.TICKETS_DELETE,
        label: 'Delete/Cancel Tickets',
        description: 'Cancel or remove service tickets',
      },
    ],
  },
  {
    category: 'Workflows',
    permissions: [
      {
        key: Permission.WORKFLOWS_CREATE,
        label: 'Create Workflows',
        description: 'Design custom multi-stage service progression pipelines',
      },
      {
        key: Permission.WORKFLOWS_READ,
        label: 'View Workflows',
        description: 'View active organization workflow pipelines and stages',
      },
      {
        key: Permission.WORKFLOWS_UPDATE,
        label: 'Edit Workflows',
        description: 'Modify stage sequence, customer labels, and descriptions',
      },
      {
        key: Permission.WORKFLOWS_DELETE,
        label: 'Delete Workflows',
        description: 'Delete unused custom workflows',
      },
    ],
  },
  {
    category: 'Team & Staff',
    permissions: [
      {
        key: Permission.USERS_CREATE,
        label: 'Add Team Members',
        description: 'Create and onboard new staff members in the organization',
      },
      {
        key: Permission.USERS_READ,
        label: 'View Team Members',
        description: 'List and view staff member profiles and roles',
      },
      {
        key: Permission.USERS_UPDATE,
        label: 'Manage Team Members',
        description: 'Update staff details, change roles, and toggle active status',
      },
      {
        key: Permission.USERS_DELETE,
        label: 'Remove Team Members',
        description: 'Deactivate or delete staff members from the organization',
      },
    ],
  },
  {
    category: 'Organization Profile & Counter QR',
    permissions: [
      {
        key: Permission.ORG_READ,
        label: 'View Organization Profile',
        description: 'View business profile details and settings',
      },
      {
        key: Permission.ORG_UPDATE,
        label: 'Update Organization Profile',
        description: 'Modify organization name and business preferences',
      },
      {
        key: Permission.ORG_QR_VIEW,
        label: 'Access Counter QR & Signage',
        description: 'View, download, and print customer tracking QR codes',
      },
    ],
  },
  {
    category: 'Subscription & Plans',
    permissions: [
      {
        key: Permission.SUBSCRIPTION_READ,
        label: 'View Subscription & Usage',
        description: 'Inspect live resource usage counters and plan limits',
      },
      {
        key: Permission.SUBSCRIPTION_MANAGE,
        label: 'Manage Subscription',
        description: 'Change or upgrade subscription plan tier',
      },
    ],
  },
  {
    category: 'Roles & Access Control',
    permissions: [
      {
        key: Permission.ROLES_READ,
        label: 'View Roles',
        description: 'View available organization and platform roles',
      },
      {
        key: Permission.ROLES_MANAGE,
        label: 'Manage Roles',
        description: 'Create, edit, and configure custom permissions for roles',
      },
    ],
  },
];

export interface RoleResponse {
  id: string;
  name: string;
  key: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  key: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: Permission[];
}
