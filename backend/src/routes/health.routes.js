import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: 'ok', database: 'up' }, 'Service is healthy');
  } catch (error) {
    logger.error('Health check failed: database unreachable', error);
    res.status(503).json({ success: false, message: 'Service unavailable', code: 'UNAVAILABLE' });
  }
});

export default router;
