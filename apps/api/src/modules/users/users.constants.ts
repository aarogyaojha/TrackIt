export const SALT_ROUNDS = 12;

export const USERS_SWAGGER = {
  TAG: 'Users',
  LIST_SUMMARY: 'List organization staff members',
  LIST_DESCRIPTION:
    'Retrieves all staff members belonging to the authenticated user organization.',
  LIST_OK_DESCRIPTION: 'List of organization staff members.',

  CREATE_SUMMARY: 'Add a new staff member',
  CREATE_DESCRIPTION:
    'Creates a new staff member within the authenticated organization, validating role and enforcing plan staff limits.',
  CREATE_CREATED_DESCRIPTION: 'Staff member created successfully.',

  UPDATE_SUMMARY: 'Update staff member',
  UPDATE_DESCRIPTION:
    'Updates staff member details, role, or active status within the authenticated organization.',
  UPDATE_OK_DESCRIPTION: 'Staff member updated successfully.',

  DELETE_SUMMARY: 'Remove staff member',
  DELETE_DESCRIPTION:
    'Deactivates or removes a staff member from the organization, preventing self-deletion and orphan states.',
  DELETE_OK_DESCRIPTION: 'Staff member removed successfully.',
};
