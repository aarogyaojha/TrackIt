import { ErrorCode } from './error-codes';

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed for the request payload.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.UNAUTHORIZED]: 'Authentication is required to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.CONFLICT]: 'Resource conflict detected',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected internal error occurred.',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'A user with this email address already exists',
  [ErrorCode.ORG_SLUG_TAKEN]: 'Organization identifier slug is already taken',
  [ErrorCode.TICKET_CODE_TAKEN]: 'A ticket with this code already exists for the organization',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.ORG_NOT_APPROVED]: 'Organization is pending approval or inactive',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'Invalid or expired refresh token',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'Invalid status transition for the resource',
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 'Plan limit exceeded for this operation',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email notification',
  [ErrorCode.OTP_INVALID]: 'Invalid verification code',
  [ErrorCode.OTP_EXPIRED]: 'Verification code has expired',
  [ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED]:
    'Maximum verification attempts exceeded. Please request a new code.',
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 'Email is already verified',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Email address is not verified',
  [ErrorCode.WORKFLOW_NAME_TAKEN]:
    'A workflow with this name already exists for the organization',
  [ErrorCode.WORKFLOW_IN_USE]:
    'Cannot delete or deactivate a workflow currently in use by tickets',
  [ErrorCode.WORKFLOW_STATUS_IN_USE]:
    'Cannot remove or modify category of a status currently in use by tickets',
  [ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT]:
    'Cannot delete the default workflow. Please set another workflow as default first.',
  [ErrorCode.INVALID_WORKFLOW_STATUSES]:
    'Workflow must contain at least one initial status and one completed status',
  [ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS]:
    'Status keys within a workflow must be unique',
  [ErrorCode.ROLE_NOT_FOUND]: 'The specified role was not found.',
  [ErrorCode.ROLE_KEY_EXISTS]: 'A role with this key already exists.',
  [ErrorCode.ROLE_CANNOT_DELETE_SYSTEM]: 'Built-in system roles cannot be deleted or renamed.',
  [ErrorCode.ROLE_IN_USE]: 'Cannot delete a role that is currently assigned to one or more staff members.',
  [ErrorCode.USER_NOT_FOUND]: 'Staff member not found.',
  [ErrorCode.CANNOT_DELETE_SELF]: 'Cannot delete or deactivate your own account.',
  [ErrorCode.CANNOT_REMOVE_LAST_ADMIN]: 'Cannot remove or deactivate the last remaining organization administrator.',
};

export const ERROR_MESSAGES = ErrorMessages;
