import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorCode, ERROR_MESSAGES } from '../../constants';

/**
 * Applies standard OpenAPI/Swagger response decorators for the specified error codes.
 *
 * Pass only the error codes this specific endpoint can actually produce;
 * do not default to applying all of them.
 *
 * @param codes - List of error codes that this endpoint can return.
 */
export function ApiStandardErrors(...codes: ErrorCode[]) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [];

  for (const code of codes) {
    const description = ERROR_MESSAGES[code];
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
        decorators.push(ApiBadRequestResponse({ description }));
        break;
      case ErrorCode.UNAUTHORIZED:
        decorators.push(ApiUnauthorizedResponse({ description }));
        break;
      case ErrorCode.FORBIDDEN:
        decorators.push(ApiForbiddenResponse({ description }));
        break;
      case ErrorCode.NOT_FOUND:
        decorators.push(ApiNotFoundResponse({ description }));
        break;
      case ErrorCode.CONFLICT:
        decorators.push(ApiConflictResponse({ description }));
        break;
      case ErrorCode.INTERNAL_ERROR:
        decorators.push(ApiInternalServerErrorResponse({ description }));
        break;
    }
  }

  return applyDecorators(...decorators);
}

