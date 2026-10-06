/**
 * Operational error with an HTTP status. Anything thrown that is not an AppError
 * is treated as an unexpected failure and reported to clients as a generic 500.
 */
export class AppError extends Error {
  constructor(statusCode, message, { code, errors } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }

  static validation(errors, message = 'Validation failed') {
    return new AppError(400, message, { code: 'VALIDATION_ERROR', errors });
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(400, message, { code });
  }

  static unauthorized(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    return new AppError(401, message, { code });
  }

  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new AppError(403, message, { code });
  }

  static notFound(resource = 'Resource') {
    return new AppError(404, `${resource} not found`, { code: 'NOT_FOUND' });
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, message, { code });
  }
}
