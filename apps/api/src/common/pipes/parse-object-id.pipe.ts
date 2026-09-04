import {
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ErrorCode, ErrorMessages } from '../../constants';
import { AppException } from '../exceptions/app.exception';

/**
 * ParseObjectIdPipe
 *
 * Validates that an incoming route parameter is a valid MongoDB ObjectId hex string.
 * Prevents unvalidated malformed IDs from reaching the database layer as uncaught
 * CastErrors (which surface as 500 Internal Server Errors), converting them into clean
 * 400 Bad Request responses with standard VALIDATION_ERROR envelope.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        ErrorMessages[ErrorCode.VALIDATION_ERROR],
      );
    }
    return value;
  }
}
