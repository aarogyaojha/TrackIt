import { Role } from '@trackit/types';
import { UserDocument } from './user.schema';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

/**
 * Transforms a UserDocument into a safe UserResponse object.
 * NEVER include passwordHash or refreshTokenHash in this mapper or in any user-facing response.
 */
export function toUserResponse(user: UserDocument): UserResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId
      ? user.organizationId.toString()
      : null,
  };
}
