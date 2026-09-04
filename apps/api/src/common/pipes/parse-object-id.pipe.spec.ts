import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ErrorCode } from '../../constants';
import { AppException } from '../exceptions/app.exception';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('should return valid ObjectId string unchanged', () => {
    const validId = new Types.ObjectId().toHexString();
    const result = pipe.transform(validId);
    expect(result).toBe(validId);
  });

  it('should throw AppException with BAD_REQUEST and VALIDATION_ERROR for invalid string', () => {
    expect(() => pipe.transform('not-an-object-id')).toThrow(AppException);

    try {
      pipe.transform('invalid-id-123');
    } catch (err: unknown) {
      const appErr = err as AppException;
      expect(appErr.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(appErr.code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should throw AppException for empty string or malformed length', () => {
    expect(() => pipe.transform('')).toThrow(AppException);
    expect(() => pipe.transform('12345')).toThrow(AppException);
  });
});
