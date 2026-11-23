import { RoleResponse } from '@trackit/types';
import { RoleDocument } from './role.schema';

export function toRoleResponse(role: RoleDocument): RoleResponse {
  return {
    id: role._id.toString(),
    name: role.name,
    key: role.key,
    description: role.description || '',
    permissions: role.permissions || [],
    isSystem: Boolean(role.isSystem),
    createdAt: (role as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: (role as unknown as { updatedAt?: Date }).updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
