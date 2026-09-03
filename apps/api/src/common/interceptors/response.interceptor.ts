import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: true;
  data: T;
  meta?: unknown;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((res) => {
        if (
          res !== null &&
          typeof res === 'object' &&
          !Array.isArray(res) &&
          'meta' in res
        ) {
          const { meta, data, ...rest } = res;
          return {
            success: true,
            data: data !== undefined ? data : rest,
            meta,
          };
        }

        return {
          success: true,
          data: res,
        };
      }),
    );
  }
}
