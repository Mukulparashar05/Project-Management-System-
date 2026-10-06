import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

export const corsOptions = {
  origin(origin, callback) {
    // Native mobile apps and server-to-server calls send no Origin header; CORS only governs browsers.
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(AppError.forbidden('Origin not allowed by CORS policy', 'CORS_ORIGIN_DENIED'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};
