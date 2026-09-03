import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, ErrorMessages } from '../../constants';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message: string = ErrorMessages[ErrorCode.INTERNAL_ERROR];
    let details: unknown = undefined;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (Array.isArray(resObj.message)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = ErrorMessages[ErrorCode.VALIDATION_ERROR];
          details = resObj.message;
        } else {
          message = (resObj.message as string) || exception.message;
          code = this.mapHttpStatusToErrorCode(status);
          if (resObj.error && resObj.error !== message) {
            details = resObj.error;
          }
        }
      } else {
        message = (res as string) || exception.message;
        code = this.mapHttpStatusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message || ErrorMessages[ErrorCode.INTERNAL_ERROR];
    }

    if (status >= 500) {
      this.logger.error(
        `[${status}] ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${status}] ${code}: ${message}`);
    }

    const errorPayload: {
      code: string;
      message: string;
      details?: unknown;
    } = {
      code,
      message,
    };

    if (details !== undefined) {
      errorPayload.details = details;
    }

    response.status(status).json({
      success: false,
      error: errorPayload,
    });
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
