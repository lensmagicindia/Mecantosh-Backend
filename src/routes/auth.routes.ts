import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  refreshTokenSchema,
  firebaseLoginSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/send-otp', authLimiter, validate(sendOTPSchema), authController.sendOTP);
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), authController.verifyOTP);
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/firebase-login', authLimiter, validate(firebaseLoginSchema), authController.firebaseLogin);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
