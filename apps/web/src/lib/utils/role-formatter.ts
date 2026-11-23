import { Role } from '@trackit/types';

export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  [Role.SUPERADMIN]: 'Superadmin',
  [Role.ORG_ADMIN]: 'Organization Admin',
  [Role.ORG_STAFF]: 'Organization Staff',
};

/**
 * Formats a role slug or key (e.g. 'ORG_ADMIN', 'SENIOR_MECHANIC') into a human-readable name.
 * Checks known system role labels first, then matches custom role list if provided,
 * and falls back to Title Case conversion of snake/kebab/screaming-snake case strings.
 */
export function formatRoleName(
  role?: string | null,
  customRoles?: Array<{ key: string; name: string }>,
): string {
  if (!role) return '';

  // 1. Direct system role lookup (case-insensitive)
  const upper = role.toUpperCase();
  if (SYSTEM_ROLE_LABELS[upper]) {
    return SYSTEM_ROLE_LABELS[upper];
  }

  // 2. Custom roles lookup by key (case-insensitive)
  if (customRoles && customRoles.length > 0) {
    const matched = customRoles.find(
      (r) => r.key.toUpperCase() === upper,
    );
    if (matched && matched.name) {
      return matched.name;
    }
  }

  // 3. Fallback: Convert SNAKE_CASE or kebab-case to Title Case (e.g., SENIOR_MECHANIC -> Senior Mechanic)
  return role
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
