import { ErrorCode, ErrorCodeType } from './error-codes';

export const ErrorMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed for request parameters.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.ORG_NOT_APPROVED]:
    "Your organization is still awaiting approval. You'll be able to log in once a superadmin approves it.",
  [ErrorCode.EMAIL_ALREADY_EXISTS]:
    'A user with this email address already exists.',
  [ErrorCode.ORG_SLUG_TAKEN]: 'Organization identifier slug is already taken.',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access. Please log in.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ErrorCode.TICKET_CODE_TAKEN]:
    'A ticket with this code already exists for your organization.',
  [ErrorCode.INVALID_STATUS_TRANSITION]:
    'This status transition is not allowed.',
  [ErrorCode.PLAN_LIMIT_EXCEEDED]:
    'Plan limit reached. Please contact support or ask an administrator to upgrade your plan tier.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
};

export const ERROR_MESSAGES = ErrorMessages;
