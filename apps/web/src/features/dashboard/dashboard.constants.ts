export const DASHBOARD_COPY = {
  BADGE: 'Dashboard',
  LOGOUT_BUTTON: 'Log out',
  WELCOME_TITLE: 'Welcome to TrackIt',
  LOGGED_IN_AS: 'Logged in as',
  DEFAULT_USER_NAME: 'User',
  TOGGLE_MENU: 'Toggle navigation menu',
  CLOSE_MENU: 'Close menu',
  NAVIGATION_TITLE: 'Navigation',
} as const;

export const DASHBOARD_METRICS_COPY = {
  TOTAL_TITLE: 'Total Tickets',
  TOTAL_DESC: 'All tickets logged in organization',
  ACTIVE_TITLE: 'Active in Progress',
  ACTIVE_DESC: 'Tickets currently being processed',
  COMPLETED_TITLE: 'Completed & Delivered',
  COMPLETED_DESC: 'Successfully fulfilled tickets',
  CANCELLED_TITLE: 'Cancelled Orders',
  CANCELLED_DESC: 'Voided or cancelled tickets',
  COMPLETION_RATE: 'completion rate',
} as const;

export const DASHBOARD_WORKFLOW_COPY = {
  TITLE: 'Workflow Stage Pipeline',
  DESCRIPTION:
    'Live ticket distribution across custom stage sequences for active workflows.',
  WORKFLOW_SELECT_LABEL: 'Select Workflow',
  DEFAULT_BADGE: 'Default Workflow',
  TOTAL_WORKFLOW_TICKETS: 'tickets in workflow',
  NO_WORKFLOWS: 'No active workflows configured for this organization.',
  NO_TICKETS: 'No tickets currently assigned to this workflow.',
  STAGE_PERCENTAGE: 'of workflow tickets',
} as const;

export const DASHBOARD_TEAM_COPY = {
  TITLE: 'Team Member Performance',
  DESCRIPTION:
    'Staff workload distribution, tickets created, and completed service orders.',
  MEMBER_HEADER: 'Staff Member',
  ROLE_HEADER: 'Role',
  CREATED_HEADER: 'Created',
  COMPLETED_HEADER: 'Completed',
  UPDATES_HEADER: 'Status Actions',
  EMPTY: 'No staff members found.',
  SUMMARY_LABEL: 'Staff Contributors',
} as const;

export const DASHBOARD_ACTIVITY_COPY = {
  TITLE: 'Recent Ticket Activity',
  DESCRIPTION: 'Latest ticket progress and customer service items.',
  VIEW_ALL_BUTTON: 'View All Tickets',
  EMPTY: 'No recent ticket activity logged yet.',
  CODE_LABEL: 'Code',
  CUSTOMER_LABEL: 'Customer',
  ITEM_LABEL: 'Item',
} as const;

export const COUNTER_QR_COPY = {
  TITLE: 'Customer Live Tracking QR Code',
  DESCRIPTION:
    'Display this QR code at your front desk or service counter. Customers scan it with their phone to look up and track their service tickets in real time.',
  COUNTER_BADGE: 'Front Counter',
  SIGN_BADGE: 'Live Tracking',
  URL_LABEL: 'Live Tracking Portal URL',
  COPY_LINK_BUTTON: 'Copy Link',
  COPIED_BUTTON: 'Copied',
  COPY_LINK_SUCCESS: 'Tracking portal link copied to clipboard',
  OPEN_PORTAL_BUTTON: 'Open Portal',
  DOWNLOAD_BUTTON: 'Download QR',
  DOWNLOAD_SUCCESS: 'QR code image downloaded',
  PRINT_POSTER_BUTTON: 'Print Counter Stand',
  PRINT_DIALOG_TITLE: 'Print Counter Tracking Sign',
  PRINT_DIALOG_DESC:
    'Print this sign and place it on your service counter for customers to track their items.',
  PRINT_BUTTON: 'Print Signage',
  CLOSE_BUTTON: 'Close',
  INSTRUCTIONS: 'Scan to Track Your Item',
  SUB_INSTRUCTIONS: 'Enter your ticket code or phone number to view live status and service progress.',
  FOOTER_BRAND: 'Powered by TrackIt',
} as const;
