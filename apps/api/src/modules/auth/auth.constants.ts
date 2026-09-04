export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const AUTH_SWAGGER = {
  TAG: 'Auth',
  LOGIN_SUMMARY: 'Log in with email and password',
  LOGIN_DESCRIPTION:
    'Authenticates user credentials, sets an httpOnly refresh token cookie, and returns an access token.',
  LOGIN_OK_DESCRIPTION: 'Successfully authenticated.',
  REFRESH_SUMMARY: 'Refresh access token',
  REFRESH_DESCRIPTION:
    'Rotates refresh token cookie and issues a new short-lived access token.',
  REFRESH_OK_DESCRIPTION: 'Token refreshed successfully.',
  LOGOUT_SUMMARY: 'Log out authenticated user',
  LOGOUT_DESCRIPTION:
    'Clears the refresh token hash on the user record and clears the refresh token cookie.',
  LOGOUT_OK_DESCRIPTION: 'Logged out successfully.',
} as const;

export const AUTH_MESSAGES = {
  LOGGED_OUT: 'Logged out successfully',
} as const;

export const LOGIN_DTO_SWAGGER = {
  EMAIL_DESCRIPTION: 'Registered user email address',
  EMAIL_EXAMPLE: 'admin@apexauto.com',
  PASSWORD_DESCRIPTION: 'User password',
  PASSWORD_EXAMPLE: 'SuperSecret123!',
} as const;
