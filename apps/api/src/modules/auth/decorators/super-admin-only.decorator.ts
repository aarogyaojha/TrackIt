import { Role } from '@trackit/types';
import { Roles } from './roles.decorator';

export const SuperAdminOnly = () => Roles(Role.SUPERADMIN);
