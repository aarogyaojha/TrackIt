import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Permission, Role } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SYSTEM_DEFAULT_ROLES } from './role.constants';
import { RolesRepository } from './role.repository';
import { RoleDocument } from './role.schema';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly rolesRepository: RolesRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultRoles();
  }

  async seedDefaultRoles(): Promise<void> {
    for (const def of SYSTEM_DEFAULT_ROLES) {
      try {
        const existing = await this.rolesRepository.findByKey(def.key);
        if (!existing) {
          await this.rolesRepository.create({
            name: def.name,
            key: def.key,
            description: def.description,
            permissions: def.permissions,
            isSystem: true,
          });
          this.logger.log(`Seeded default system role: ${def.key}`);
        }
      } catch (err) {
        this.logger.warn(`Failed seeding role ${def.key}: ${(err as Error).message}`);
      }
    }
  }

  async listRoles(): Promise<RoleDocument[]> {
    return this.rolesRepository.findAllRoles();
  }

  async getRoleById(id: string): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.ROLE_NOT_FOUND,
        ErrorMessages[ErrorCode.ROLE_NOT_FOUND],
      );
    }
    return role;
  }

  async getRoleByKey(key: string): Promise<RoleDocument | null> {
    return this.rolesRepository.findByKey(key);
  }

  private assertAssignablePermissions(
    roleKey: string,
    permissions?: Permission[],
  ): void {
    if (!permissions) return;

    if (
      roleKey !== Role.SUPERADMIN &&
      permissions.includes(Permission.PLATFORM_ALL)
    ) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Cannot assign wildcard platform permission to non-superadmin roles',
      );
    }
  }

  async createRole(dto: CreateRoleDto): Promise<RoleDocument> {
    const key = dto.key.toUpperCase().trim();
    if (key === Role.SUPERADMIN) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Cannot create a role with reserved key SUPERADMIN',
      );
    }

    this.assertAssignablePermissions(key, dto.permissions);

    const existing = await this.rolesRepository.findByKey(key);
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.ROLE_KEY_EXISTS,
        ErrorMessages[ErrorCode.ROLE_KEY_EXISTS],
      );
    }

    return this.rolesRepository.create({
      name: dto.name.trim(),
      key,
      description: dto.description?.trim() || '',
      permissions: dto.permissions,
      isSystem: false,
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.getRoleById(id);

    this.assertAssignablePermissions(role.key, dto.permissions);

    if (role.isSystem) {
      // System roles can have permissions customized by superadmin, but name and key cannot be overwritten
      if (dto.name && dto.name !== role.name) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.ROLE_CANNOT_DELETE_SYSTEM,
          ErrorMessages[ErrorCode.ROLE_CANNOT_DELETE_SYSTEM],
        );
      }
    }

    const updatePayload: Partial<RoleDocument> = {};
    if (dto.name !== undefined && !role.isSystem) {
      updatePayload.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      updatePayload.description = dto.description.trim();
    }
    if (dto.permissions !== undefined) {
      updatePayload.permissions = dto.permissions;
    }

    const updated = await this.rolesRepository.updateById(id, { $set: updatePayload });
    return updated!;
  }

  async deleteRole(id: string, isRoleInUseCheck?: (roleKey: string) => Promise<boolean>): Promise<void> {
    const role = await this.getRoleById(id);

    if (role.isSystem) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.ROLE_CANNOT_DELETE_SYSTEM,
        ErrorMessages[ErrorCode.ROLE_CANNOT_DELETE_SYSTEM],
      );
    }

    if (isRoleInUseCheck) {
      const inUse = await isRoleInUseCheck(role.key);
      if (inUse) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ErrorCode.ROLE_IN_USE,
          ErrorMessages[ErrorCode.ROLE_IN_USE],
        );
      }
    }

    await this.rolesRepository.deleteById(id);
  }

  async getPermissionsForRole(roleKey: string): Promise<Permission[]> {
    if (roleKey === 'SUPERADMIN') {
      return [Permission.PLATFORM_ALL];
    }

    const role = await this.rolesRepository.findByKey(roleKey);
    if (role) {
      return role.permissions;
    }

    // Fallback to system default role definitions if DB has not synced yet
    const systemDef = SYSTEM_DEFAULT_ROLES.find((r) => r.key === roleKey);
    return systemDef ? systemDef.permissions : [];
  }
}
