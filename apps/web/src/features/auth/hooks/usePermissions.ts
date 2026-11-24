'use client';

import { Permission, Role } from '@trackit/types';
import { useAppSelector } from '@/lib/redux/hooks';

export function usePermissions() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin =
    user?.role === Role.SUPERADMIN || user?.role === 'SUPERADMIN';
  const isOrgAdmin =
    user?.role === Role.ORG_ADMIN || user?.role === 'ORG_ADMIN';

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // Platform superadmin has full master bypass
    if (isSuperAdmin) return true;
    // Wildcard bypass
    if (user.permissions && user.permissions.includes(Permission.PLATFORM_ALL)) {
      return true;
    }
    // Explicit permission list check if populated
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }
    // Fallback based on canonical system roles
    if (isOrgAdmin) {
      return true;
    }
    if (user.role === Role.ORG_STAFF || user.role === 'ORG_STAFF') {
      return [
        Permission.TICKETS_CREATE,
        Permission.TICKETS_READ,
        Permission.TICKETS_UPDATE_STATUS,
        Permission.WORKFLOWS_READ,
      ].includes(permission);
    }
    return false;
  };

  return {
    user,
    isSuperAdmin,
    isOrgAdmin,
    hasPermission,
    canViewTickets: hasPermission(Permission.TICKETS_READ),
    canCreateTickets: hasPermission(Permission.TICKETS_CREATE),
    canUpdateTicketStatus: hasPermission(Permission.TICKETS_UPDATE_STATUS),
    canDeleteTickets: hasPermission(Permission.TICKETS_DELETE),
    canViewWorkflows: hasPermission(Permission.WORKFLOWS_READ),
    canManageWorkflows:
      hasPermission(Permission.WORKFLOWS_CREATE) ||
      hasPermission(Permission.WORKFLOWS_UPDATE),
    canViewUsers: hasPermission(Permission.USERS_READ),
    canManageUsers:
      hasPermission(Permission.USERS_CREATE) ||
      hasPermission(Permission.USERS_UPDATE),
    canViewSubscription: hasPermission(Permission.SUBSCRIPTION_READ),
    canViewQr:
      hasPermission(Permission.ORG_QR_VIEW) ||
      hasPermission(Permission.ORG_READ),
  };
}

