import { z } from 'zod';

// Query strings arrive as strings; treat "?status=" the same as an absent filter.
const emptyToUndefined = (value) => (value === '' ? undefined : value);

export function optionalQuery(schema) {
  return z.preprocess(emptyToUndefined, schema.optional());
}

export const searchQuery = optionalQuery(
  z.string().trim().max(100, 'Search text must be at most 100 characters'),
);

export const idParamsSchema = z.object({
  id: z.uuid('Invalid id format'),
});

export function requiredUuid(label) {
  return z.uuid({
    error: (issue) =>
      issue.input === undefined ? `${label} is required` : `${label} must be a valid id`,
  });
}

// Calendar date in YYYY-MM-DD form; Zod's ISO date check also rejects impossible days like 2026-02-30.
export const dateOnly = z.iso.date({ error: 'Must be a valid date in YYYY-MM-DD format' });

export const optionalDate = dateOnly.nullable().optional();

export function requiredName(label, maxLength) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);
}

export const optionalDescription = z
  .string({ error: 'Description must be text' })
  .trim()
  .max(2000, 'Description must be at most 2000 characters')
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));

export function enumField(values, label) {
  return z.enum(values, { error: `${label} must be one of ${Object.values(values).join(', ')}` });
}

export function isDateRangeValid(startDate, endDate) {
  // ISO dates compare correctly as strings.
  return !startDate || !endDate || startDate <= endDate;
}

export const DATE_RANGE_ERROR = 'End date must be on or after the start date';

export function hasAnyField(value) {
  return Object.values(value).some((field) => field !== undefined);
}
