import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role | string;
  permissions?: Permission[];
  organizationId: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffPayload {
  email: string;
  password: string;
  name: string;
  role: Role | string;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: Role | string;
  isActive?: boolean;
}
