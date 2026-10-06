import morgan from 'morgan';
import { env } from '../config/env.js';

// Logs method, path, status and timing only: no headers, bodies or tokens.
const format = env.isProduction
  ? ':date[iso] :method :url :status :res[content-length] - :response-time ms'
  : 'dev';

export const requestLogger = morgan(format, {
  skip: () => env.isTest,
});
