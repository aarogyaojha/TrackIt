import { SetMetadata } from '@nestjs/common';
import { Permission } from '@trackit/types';
import { PERMISSIONS_KEY } from '../auth.constants';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
