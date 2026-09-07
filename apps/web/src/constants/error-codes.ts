// Mirrors apps/api/src/constants/error-codes.ts — kept as a separate small set deliberately, not shared via packages/types, to avoid an invasive backend refactor. Keep these two files in sync manually.

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ORG_NOT_APPROVED: 'ORG_NOT_APPROVED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ORG_SLUG_TAKEN: 'ORG_SLUG_TAKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  TICKET_CODE_TAKEN: 'TICKET_CODE_TAKEN',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
export type ErrorCode = ErrorCodeType;
