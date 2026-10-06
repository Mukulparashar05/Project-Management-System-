/**
 * Project and task dates are calendar dates (PostgreSQL DATE). The API exchanges them as
 * "YYYY-MM-DD" strings so clients in any timezone see the same day.
 */
export function toDateOnlyString(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function fromDateOnlyString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(`${value}T00:00:00.000Z`);
}
