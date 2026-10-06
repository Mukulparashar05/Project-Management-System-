/**
 * Builds a case-insensitive "name contains" filter. Prisma passes the value as a bound
 * parameter (no SQL injection), but it does not escape LIKE wildcards, so "%" and "_"
 * are escaped here to make them match literally.
 */
export function nameContains(search) {
  if (!search) return undefined;
  return { contains: search.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' };
}
