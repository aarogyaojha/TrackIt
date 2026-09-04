export const PLATFORM_SETTINGS_SWAGGER = {
  TAG: 'Platform Settings',
  GET_SUMMARY: 'Get platform settings',
  GET_DESCRIPTION:
    'Fetches global platform settings including organization approval requirement (Superadmin only).',
  GET_OK_DESCRIPTION: 'Platform settings fetched successfully.',
  UPDATE_SUMMARY: 'Update platform settings',
  UPDATE_DESCRIPTION:
    'Updates global platform settings such as organization approval requirement (Superadmin only).',
  UPDATE_OK_DESCRIPTION: 'Platform settings updated successfully.',
} as const;

export const PLATFORM_SETTINGS_DTO_SWAGGER = {
  REQUIRE_ORG_APPROVAL_DESCRIPTION:
    'Whether new organizations require superadmin approval before becoming active',
  REQUIRE_ORG_APPROVAL_EXAMPLE: true,
} as const;
