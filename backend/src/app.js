import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRateLimiter } from './middleware/rateLimiters.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // Needed behind a hosting proxy so rate limiting sees the real client IP.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRateLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
