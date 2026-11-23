export const TEAM_COPY = {
  PAGE_TITLE: 'Team & Staff',
  PAGE_DESCRIPTION:
    'Manage staff accounts, assign granular roles, and enforce organization plan member limits.',
  ADD_MEMBER_BUTTON: 'Add Team Member',
  EDIT_MEMBER_BUTTON: 'Edit',
  DELETE_MEMBER_BUTTON: 'Remove',
  STATUS_ACTIVE: 'Active',
  STATUS_INACTIVE: 'Inactive',
  YOU_BADGE: 'You',
  USAGE_LABEL: 'Staff Accounts',
  TABLE: {
    NAME: 'Name',
    EMAIL: 'Email',
    ROLE: 'Role',
    STATUS: 'Status',
    JOINED: 'Joined',
    ACTIONS: 'Actions',
    EMPTY: 'No staff members found.',
  },
  ADD_DIALOG: {
    TITLE: 'Add Team Member',
    DESCRIPTION:
      'Create an account for a new staff member and assign their initial access role.',
    NAME_LABEL: 'Full Name',
    NAME_PLACEHOLDER: 'Jane Doe',
    EMAIL_LABEL: 'Email Address',
    EMAIL_PLACEHOLDER: 'jane@example.com',
    PASSWORD_LABEL: 'Initial Password',
    PASSWORD_PLACEHOLDER: 'Minimum 8 characters',
    ROLE_LABEL: 'Assigned Role',
    ROLE_PLACEHOLDER: 'Select a role',
    SUBMIT: 'Create Member',
    CANCEL: 'Cancel',
  },
  EDIT_DIALOG: {
    TITLE: 'Edit Team Member',
    DESCRIPTION: 'Update member details, role assignment, or active status.',
    NAME_LABEL: 'Full Name',
    ROLE_LABEL: 'Assigned Role',
    STATUS_LABEL: 'Account Status',
    ACTIVE_TOGGLE_LABEL: 'Active Account',
    ACTIVE_TOGGLE_HELP:
      'Inactive accounts cannot log in to TrackIt or perform organization actions.',
    SUBMIT: 'Save Changes',
    CANCEL: 'Cancel',
  },
  DELETE_DIALOG: {
    TITLE: 'Remove Team Member',
    DESCRIPTION:
      'Are you sure you want to remove this staff member from your organization? They will immediately lose access to all tickets and organizational tools.',
    CONFIRM: 'Remove Member',
    CANCEL: 'Cancel',
  },
  TOAST: {
    CREATE_SUCCESS: 'Team member added successfully.',
    UPDATE_SUCCESS: 'Team member updated successfully.',
    DELETE_SUCCESS: 'Team member removed successfully.',
    ERROR_GENERIC: 'An error occurred while saving the team member.',
    PLAN_LIMIT_REACHED:
      'Your organization has reached the staff user limit for its current plan. Please upgrade your subscription to add more members.',
  },
} as const;
