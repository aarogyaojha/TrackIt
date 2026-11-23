import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@trackit/types';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../../constants';
import { RolesService } from '../../roles/role.service';
import { PERMISSIONS_KEY } from '../auth.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
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

    // Superadmin has master bypass across all endpoints
    if (user.role === Role.SUPERADMIN || user.role === 'SUPERADMIN') {
      return true;
    }

    const userPermissions = await this.rolesService.getPermissionsForRole(
      user.role,
    );

    // If role has wildcard permission, allow
    if (userPermissions.includes(Permission.PLATFORM_ALL)) {
      return true;
    }

    // Check that every required permission is present
    const hasAll = requiredPermissions.every((p) =>
      userPermissions.includes(p),
    );

    if (!hasAll) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        ErrorMessages[ErrorCode.FORBIDDEN],
      );
    }

    return true;
  }
}
