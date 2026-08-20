import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rate-limit';
import {
  registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema,
} from '../validators/auth.validators';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPasswordHandler);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/password', authenticate, validate(changePasswordSchema), authController.updatePassword);

export default router;
