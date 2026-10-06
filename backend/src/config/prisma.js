import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// One client per process: Prisma manages its own connection pool.
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
