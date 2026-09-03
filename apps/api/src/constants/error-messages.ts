import { ErrorCode, ErrorCodeType } from './error-codes';

export const ErrorMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed for request parameters',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.FORBIDDEN]: 'Forbidden access to this resource',
  [ErrorCode.CONFLICT]: 'Resource conflict detected',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected internal error occurred',
};
