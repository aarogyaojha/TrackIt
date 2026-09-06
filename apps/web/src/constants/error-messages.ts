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
};

export const ERROR_MESSAGES = ErrorMessages;
