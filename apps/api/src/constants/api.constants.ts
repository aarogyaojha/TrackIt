/**
 * Global API Prefix.
 *
 * This is a code-level API-surface decision (not an environment variable) —
 * it doesn't change per deployment, only per intentional version bump.
 */
export const API_PREFIX = 'api/v1' as const;
