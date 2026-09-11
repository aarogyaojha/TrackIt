export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

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
  VERIFY_EMAIL_SUMMARY: 'Verify email address with OTP code',
  VERIFY_EMAIL_DESCRIPTION:
    'Verifies a user email using the 6-digit OTP sent upon registration.',
  VERIFY_EMAIL_OK_DESCRIPTION: 'Email verified successfully.',
  VERIFY_EMAIL_BAD_REQUEST_DESCRIPTION:
    'Invalid verification code or code has expired.',
  VERIFY_EMAIL_CONFLICT_DESCRIPTION: 'Email is already verified.',
  VERIFY_EMAIL_TOO_MANY_REQUESTS_DESCRIPTION:
    'Maximum verification attempts exceeded. Please request a new code.',
  VERIFY_EMAIL_NOT_FOUND_DESCRIPTION: 'User not found.',
  RESEND_EMAIL_VERIFICATION_SUMMARY: 'Resend email verification OTP',
  RESEND_EMAIL_VERIFICATION_DESCRIPTION:
    'Generates and sends a new verification OTP to the user email.',
  RESEND_EMAIL_VERIFICATION_OK_DESCRIPTION:
    'Verification email sent successfully.',
  RESEND_EMAIL_VERIFICATION_CONFLICT_DESCRIPTION: 'Email is already verified.',
  RESEND_EMAIL_VERIFICATION_NOT_FOUND_DESCRIPTION: 'User not found.',
} as const;

export const AUTH_MESSAGES = {
  LOGGED_OUT: 'Logged out successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  EMAIL_VERIFICATION_SENT: 'Verification email sent successfully',
} as const;

export const LOGIN_DTO_SWAGGER = {
  EMAIL_DESCRIPTION: 'Registered user email address',
  EMAIL_EXAMPLE: 'admin@apexauto.com',
  PASSWORD_DESCRIPTION: 'User password',
  PASSWORD_EXAMPLE: 'SuperSecret123!',
} as const;

export const VERIFY_EMAIL_DTO_SWAGGER = {
  EMAIL_DESCRIPTION: 'Registered user email address',
  EMAIL_EXAMPLE: 'admin@apexauto.com',
  OTP_DESCRIPTION: '6-digit verification code',
  OTP_EXAMPLE: '123456',
} as const;

export const RESEND_EMAIL_VERIFICATION_DTO_SWAGGER = {
  EMAIL_DESCRIPTION: 'Registered user email address',
  EMAIL_EXAMPLE: 'admin@apexauto.com',
} as const;

