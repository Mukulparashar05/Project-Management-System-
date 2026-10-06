import { AppError } from '../utils/AppError.js';

function formatIssues(issues) {
  return issues.map((issue) => {
    if (issue.code === 'unrecognized_keys') {
      return { field: issue.keys.join(', '), message: `Field not allowed: ${issue.keys.join(', ')}` };
    }
    return { field: issue.path.join('.') || 'body', message: issue.message };
  });
}

/**
 * Validates request parts against Zod schemas, e.g. validate({ params, query, body }).
 * Parsed (trimmed, defaulted, coerced) values are exposed on req.validated because
 * Express 5 makes req.query read-only.
 */
export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const issues = [];

    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) validated[part] = result.data;
      else issues.push(...result.error.issues);
    }

    if (issues.length > 0) {
      throw AppError.validation(formatIssues(issues));
    }

    req.validated = validated;
    next();
  };
}
