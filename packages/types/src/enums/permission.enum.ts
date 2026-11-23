export enum Permission {
  // Tickets
  TICKETS_CREATE = 'tickets:create',
  TICKETS_READ = 'tickets:read',
  TICKETS_UPDATE = 'tickets:update',
  TICKETS_UPDATE_STATUS = 'tickets:update_status',
  TICKETS_DELETE = 'tickets:delete',

  // Workflows
  WORKFLOWS_CREATE = 'workflows:create',
  WORKFLOWS_READ = 'workflows:read',
  WORKFLOWS_UPDATE = 'workflows:update',
  WORKFLOWS_DELETE = 'workflows:delete',

  // Team Members / Users
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // Organization Settings
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_QR_VIEW = 'org:qr_view',

  // Subscription
  SUBSCRIPTION_READ = 'subscription:read',
  SUBSCRIPTION_MANAGE = 'subscription:manage',

  // Roles & Permissions
  ROLES_READ = 'roles:read',
  ROLES_MANAGE = 'roles:manage',

  // Platform (Superadmin Wildcard)
  PLATFORM_ALL = 'platform:*',
}
