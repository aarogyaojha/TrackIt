import { Role } from '@trackit/types';
import { UserDocument } from './user.schema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role | string;
  organizationId: string | null;
  isActive: boolean;
  createdAt?: string;
}

/**
 * Transforms a UserDocument into a safe UserResponse object.
 * NEVER include passwordHash or refreshTokenHash in this mapper or in any user-facing response.
 */
export function toUserResponse(user: UserDocument): UserResponse {
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

  if (user.createdAt) {
    response.createdAt = user.createdAt.toISOString();
  }

  return response;
}
