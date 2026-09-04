import { SetMetadata } from '@nestjs/common';
import { Role } from '@trackit/types';
import { ROLES_KEY } from '../auth.constants';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
