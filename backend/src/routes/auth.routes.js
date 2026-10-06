import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
