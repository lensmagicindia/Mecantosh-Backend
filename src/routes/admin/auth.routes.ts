import { Router } from 'express';
import * as authController from '../../controllers/admin/auth.controller.js';
import { authenticateAdmin } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { adminLoginSchema, adminRefreshTokenSchema } from '../../validators/admin.validator.js';

const router: Router = Router();

// Public routes
router.post('/login', validate(adminLoginSchema), authController.login);
router.post('/refresh-token', validate(adminRefreshTokenSchema), authController.refreshToken);

// Protected routes
router.post('/logout', authenticateAdmin, authController.logout);
router.get('/me', authenticateAdmin, authController.getMe);

export default router;
