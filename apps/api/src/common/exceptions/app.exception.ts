import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodeType } from '../../constants';

export class AppException extends HttpException {
  public readonly code: ErrorCodeType | string;
  public readonly details?: unknown;

  constructor(
    httpStatus: HttpStatus,
    code: ErrorCodeType | string,
    message: string,
    details?: unknown,
  ) {
    super(
      {
        code,
        message,
        details,
      },
      httpStatus,
    );
    this.code = code;
    this.details = details;
  }
}
