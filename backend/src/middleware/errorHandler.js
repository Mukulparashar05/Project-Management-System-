import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

function fromBodyParserError(err) {
  if (err.type === 'entity.parse.failed') {
    return AppError.badRequest('Request body contains invalid JSON', 'INVALID_JSON');
  }
  if (err.type === 'entity.too.large') {
    return new AppError(413, 'Request body is too large', { code: 'PAYLOAD_TOO_LARGE' });
  }
  return null;
}

function fromPrismaError(err) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (err.code) {
    case 'P2002':
      return AppError.conflict('A record with the same unique value already exists');
    case 'P2003':
      return AppError.badRequest('A related record does not exist', 'INVALID_REFERENCE');
    case 'P2025':
      return AppError.notFound('Resource');
    default:
      return null;
  }
}

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const knownError = err instanceof AppError ? err : (fromBodyParserError(err) ?? fromPrismaError(err));

  if (!knownError) {
    // Full details stay in the server log; clients only ever get a generic message.
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      code: 'INTERNAL_ERROR',
    });
    return;
  }

  const body = { success: false, message: knownError.message };
  if (knownError.code) body.code = knownError.code;
  if (knownError.errors) body.errors = knownError.errors;
  res.status(knownError.statusCode).json(body);
}
