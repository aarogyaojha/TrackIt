import { OrgStatus } from '@trackit/types';

export const ORG_STATUS_LABELS: Record<OrgStatus, string> = {
  [OrgStatus.PENDING]: 'Pending',
  [OrgStatus.ACTIVE]: 'Active',
  [OrgStatus.SUSPENDED]: 'Suspended',
  [OrgStatus.REJECTED]: 'Rejected',
} as const;

export const ORG_STATUS_BADGE_VARIANT: Record<
  OrgStatus,
  'warning' | 'success' | 'destructive' | 'outline'
> = {
  [OrgStatus.PENDING]: 'warning',
  [OrgStatus.ACTIVE]: 'success',
  [OrgStatus.SUSPENDED]: 'destructive',
  [OrgStatus.REJECTED]: 'outline',
} as const;

/**
 * Valid superadmin actions per organization status.
 * Source of truth: apps/api/src/modules/organizations/organization.service.ts (approve/reject/suspend/reactivate methods).
 * - PENDING -> ACTIVE (approve) or REJECTED (reject)
 * - ACTIVE -> SUSPENDED (suspend)
 * - SUSPENDED -> ACTIVE (reactivate)
 * - REJECTED -> terminal state (no transitions)
 */
export const ORG_STATUS_ACTIONS: Record<
  OrgStatus,
  Array<'approve' | 'reject' | 'suspend' | 'reactivate'>
> = {
  [OrgStatus.PENDING]: ['approve', 'reject'],
  [OrgStatus.ACTIVE]: ['suspend'],
  [OrgStatus.SUSPENDED]: ['reactivate'],
  [OrgStatus.REJECTED]: [],
} as const;

export const SUPERADMIN_COPY = {
  PORTAL_LABEL: 'Superadmin',
  NAV: {
    ORGANIZATIONS: 'Organizations',
    PLANS: 'Plans',
    SETTINGS: 'Settings',
  },
  ORGANIZATIONS: {
    TITLE: 'Organizations',
    DESCRIPTION: 'Manage registered tenant organizations and approval queues.',
    TABS: {
      ALL: 'All',
      PENDING: 'Pending',
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
      REJECTED: 'Rejected',
    },
    TABLE: {
      NAME: 'Organization Name',
      SLUG: 'Slug',
      STATUS: 'Status',
      CREATED: 'Created Date',
      ACTIONS: 'Actions',
      VIEW_DETAILS: 'View Details',
    },
    EMPTY_STATES: {
      ALL: 'No organizations found.',
      PENDING: 'No pending organizations waiting for approval.',
      ACTIVE: 'No active organizations.',
      SUSPENDED: 'No suspended organizations.',
      REJECTED: 'No rejected organizations.',
    },
    ACTIONS: {
      APPROVE: 'Approve',
      REJECT: 'Reject',
      SUSPEND: 'Suspend',
      REACTIVATE: 'Reactivate',
      APPROVING: 'Approving...',
      REJECTING: 'Rejecting...',
      SUSPENDING: 'Suspending...',
      REACTIVATING: 'Reactivating...',
      APPROVE_SUCCESS: 'Organization approved successfully.',
      REJECT_SUCCESS: 'Organization rejected.',
      SUSPEND_SUCCESS: 'Organization suspended.',
      REACTIVATE_SUCCESS: 'Organization reactivated.',
    },
    DETAIL: {
      TITLE: 'Organization Details',
      BACK_LINK: 'Back to Organizations',
      PROFILE_SECTION: 'Profile Information',
      NAME_LABEL: 'Organization Name',
      SLUG_LABEL: 'Slug / Unique Code',
      STATUS_LABEL: 'Current Status',
      CREATED_LABEL: 'Registered At',
      SUBSCRIPTION_SECTION: 'Subscription & Usage',
      CHANGE_TIER_TITLE: 'Change Subscription Tier',
      CHANGE_TIER_DESCRIPTION:
        'Instantly update the subscription tier for this organization without proration.',
      SELECT_TIER_LABEL: 'Select Tier',
      CHANGE_TIER_BUTTON: 'Change Tier',
      CHANGING_TIER: 'Updating Tier...',
      CHANGE_TIER_SUCCESS: 'Subscription tier updated successfully.',
      NOT_FOUND_TITLE: 'Organization Not Found',
      NOT_FOUND_DESCRIPTION:
        'The requested organization could not be found or has an invalid ID.',
    },
  },
  DIALOGS: {
    REJECT: {
      TITLE: 'Reject Organization Registration',
      DESCRIPTION:
        'Are you sure you want to reject this organization? This cannot be undone via this UI, and the organization will be permanently unable to operate.',
      CONFIRM: 'Reject Organization',
      CANCEL: 'Cancel',
    },
    SUSPEND: {
      TITLE: 'Suspend Organization',
      DESCRIPTION:
        'Are you sure you want to suspend this organization? Staff and administrators will immediately lose access to their dashboard until reactivated.',
      CONFIRM: 'Suspend Organization',
      CANCEL: 'Cancel',
    },
    CHANGE_TIER: {
      TITLE: 'Confirm Plan Tier Change',
      DESCRIPTION:
        'Are you sure you want to change the subscription plan tier for this organization? Tier changes take effect immediately.',
      CONFIRM: 'Confirm Change',
      CANCEL: 'Cancel',
    },
  },
  PLANS: {
    TITLE: 'Plan Limits & Configuration',
    DESCRIPTION:
      'Configure default resource limits across platform subscription tiers.',
    MAX_ACTIVE_TICKETS: 'Max Active Tickets',
    MAX_STAFF_USERS: 'Max Staff Users',
    MAX_TICKETS_PER_MONTH: 'Max Tickets Per Month',
    UNLIMITED_HINT: 'Use 0 for unlimited resources (if supported).',
    SAVE_BUTTON: 'Save Limits',
    SAVING: 'Saving...',
    SAVE_SUCCESS: 'Plan limits updated successfully.',
    TIER_LABELS: {
      FREE: 'Free Tier',
      BASIC: 'Basic Tier',
      PRO: 'Pro Tier',
    },
  },
  SETTINGS: {
    TITLE: 'Platform Settings',
    DESCRIPTION: 'Configure platform-wide behavior and registration workflows.',
    REQUIRE_APPROVAL_TITLE: 'Require Organization Approval',
    REQUIRE_APPROVAL_DESCRIPTION:
      'When enabled, newly registered organizations require manual superadmin approval (status PENDING) before they can access their dashboard. When disabled, newly registered organizations are immediately ACTIVE.',
    TOGGLE_SUCCESS_ENABLED: 'Organization approval is now required.',
    TOGGLE_SUCCESS_DISABLED:
      'Organization approval is now disabled (auto-activate).',
  },
} as const;
