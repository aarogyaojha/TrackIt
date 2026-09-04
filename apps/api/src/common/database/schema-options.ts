/**
 * Schema transform function for toJSON option in Mongoose schemas.
 * Converts `_id` to a string `id`, deletes `_id` and `__v`, and deletes
 * `passwordHash` / `refreshTokenHash` if present on the object.
 *
 * Used as defense-in-depth in @Schema({ toJSON: { transform: toJsonTransform } }).
 */
export function toJsonTransform(
  _doc: unknown,
  ret: Record<string, unknown>,
): Record<string, unknown> {
  if (ret._id !== undefined && ret._id !== null) {
    ret.id = String(ret._id);
    delete ret._id;
  }
  delete ret.__v;
  delete ret.passwordHash;
  delete ret.refreshTokenHash;
  return ret;
}
