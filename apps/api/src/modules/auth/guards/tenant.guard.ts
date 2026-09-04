import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../../constants';

/**
 * TenantGuard
 *
 * Ensures that the authenticated user is bound to an active tenant organization context.
 *
 * Behavior:
 * - Reads `organizationId` from `req.user` (which is decoded and attached by `JwtStrategy`).
 * - If `organizationId` is missing or null (e.g. platform SUPERADMIN users without an org scope,
 *   or unauthenticated requests), this guard throws an `AppException` with 403 Forbidden and
 *   error code `FORBIDDEN`.
 * - When applied to tenant-scoped routes (such as `/organizations/me`, ticket management, etc.),
 *   it guarantees that subsequent controllers and services have a valid `organizationId` to enforce
 *   strict multi-tenant isolation.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        ErrorMessages[ErrorCode.FORBIDDEN],
      );
    }

    return true;
  }
}
