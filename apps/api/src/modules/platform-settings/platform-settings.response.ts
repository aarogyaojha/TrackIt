import { PlatformSettingsDocument } from './platform-settings.schema';

export interface PlatformSettingsResponse {
  requireOrgApproval: boolean;
  updatedAt?: Date;
}

export function toPlatformSettingsResponse(
  settings: PlatformSettingsDocument,
): PlatformSettingsResponse {
  return {
    requireOrgApproval: settings.requireOrgApproval,
    updatedAt: settings.updatedAt,
  };
}
