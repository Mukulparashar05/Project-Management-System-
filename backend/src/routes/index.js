import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Everything below requires a valid JWT.
router.use('/projects', authenticate, projectRoutes);
router.use('/tasks', authenticate, taskRoutes);

export default router;
