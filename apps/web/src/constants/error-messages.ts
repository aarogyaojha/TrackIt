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
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email notification.',
  [ErrorCode.OTP_INVALID]: 'Invalid verification code.',
  [ErrorCode.OTP_EXPIRED]: 'Verification code has expired.',
  [ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED]:
    'Maximum verification attempts exceeded. Please request a new code.',
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 'Email is already verified.',
  [ErrorCode.EMAIL_NOT_VERIFIED]:
    'Your email address is not verified. Please verify your email before logging in.',
  [ErrorCode.WORKFLOW_NAME_TAKEN]:
    'A workflow with this name already exists for your organization.',
  [ErrorCode.WORKFLOW_IN_USE]:
    'Cannot delete or deactivate a workflow that is currently in use by tickets.',
  [ErrorCode.WORKFLOW_STATUS_IN_USE]:
    'Cannot remove or modify status stages that are currently in use by tickets.',
  [ErrorCode.WORKFLOW_CANNOT_DELETE_DEFAULT]:
    'Cannot delete the default workflow. Please set another workflow as default first.',
  [ErrorCode.INVALID_WORKFLOW_STATUSES]:
    'Workflow must contain at least one initial status and one completed status.',
  [ErrorCode.DUPLICATE_WORKFLOW_STATUS_KEYS]:
    'Status keys within a workflow must be unique.',
};

export const ERROR_MESSAGES = ErrorMessages;
