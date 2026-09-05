import { ErrorCode, ErrorCodeType } from './error-codes';

export const ErrorMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed for request parameters',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.FORBIDDEN]: 'Forbidden access to this resource',
  [ErrorCode.CONFLICT]: 'Resource conflict detected',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected internal error occurred',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'A user with this email address already exists',
  [ErrorCode.ORG_SLUG_TAKEN]: 'Organization identifier slug is already taken',
  [ErrorCode.TICKET_CODE_TAKEN]: 'A ticket with this code already exists for the organization',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.ORG_NOT_APPROVED]: 'Organization is pending approval or inactive',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'Invalid or expired refresh token',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'Invalid status transition for the resource',
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 'Plan limit exceeded for this operation',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
};

export const ERROR_MESSAGES = ErrorMessages;
