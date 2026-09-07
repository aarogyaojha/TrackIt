export const APP_NAME = 'TrackIt';

export const APP_TAGLINE =
  'Multi-tenant ticketing and status-tracking SaaS for service businesses';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TICKETS: '/dashboard/tickets',
  SETTINGS: '/dashboard/settings',
} as const;

export const MARKETING_COPY = {
  LOGIN_LINK: 'Log in',
  REGISTER_BUTTON: 'Register',
} as const;
