import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@trackit/types';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../../constants';
import { ROLES_KEY } from '../auth.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        ErrorMessages[ErrorCode.FORBIDDEN],
      );
    }

    const hasRole = requiredRoles.includes(user.role as Role);
    if (!hasRole) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        ErrorMessages[ErrorCode.FORBIDDEN],
      );
    }

    return true;
  }
}