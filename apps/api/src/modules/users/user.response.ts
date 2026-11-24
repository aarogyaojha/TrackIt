import { Permission, Role } from '@trackit/types';
import { UserDocument } from './user.schema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role | string;
  permissions?: Permission[];
  organizationId: string | null;
  isActive: boolean;
  createdAt?: string;
}

/**
 * Transforms a UserDocument into a safe UserResponse object.
 * NEVER include passwordHash or refreshTokenHash in this mapper or in any user-facing response.
 */
export function toUserResponse(
  user: UserDocument,
  permissions?: Permission[],
): UserResponse {
  const response: UserResponse = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId
      ? user.organizationId.toString()
      : null,
    isActive: user.isActive !== undefined ? user.isActive : true,
  };

  if (permissions && permissions.length > 0) {
    response.permissions = permissions;
  }

  if (user.createdAt) {
    response.createdAt = user.createdAt.toISOString();
  }

  return response;
}
