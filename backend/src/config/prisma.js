import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const logLevels = {
  development: ['warn', 'error'],
  production: ['error'],
  test: [],
};

// One client per process: Prisma manages its own connection pool.
export const prisma = new PrismaClient({ log: logLevels[env.NODE_ENV] });
