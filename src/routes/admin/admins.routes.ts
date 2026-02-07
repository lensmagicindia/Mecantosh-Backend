import { Router } from 'express';
import * as adminsController from '../../controllers/admin/admins.controller.js';
import { authenticateAdmin, requireSuperAdmin } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
  getAdminsQuerySchema,
} from '../../validators/admin.validator.js';

const router: Router = Router();

// All routes require admin authentication and super admin role
router.use(authenticateAdmin);
router.use(requireSuperAdmin);

// GET /api/v1/admin/admins/permissions - Get available permissions (must be before /:id route)
router.get('/permissions', adminsController.getPermissions);

// GET /api/v1/admin/admins - List all admins
router.get('/', validate(getAdminsQuerySchema), adminsController.getAdmins);

// GET /api/v1/admin/admins/:id - Get admin by ID
router.get('/:id', validate(adminIdParamSchema), adminsController.getAdminById);

// POST /api/v1/admin/admins - Create new admin
router.post('/', validate(createAdminSchema), adminsController.createAdmin);

// PATCH /api/v1/admin/admins/:id - Update admin
router.patch('/:id', validate(updateAdminSchema), adminsController.updateAdmin);

// DELETE /api/v1/admin/admins/:id - Delete admin
router.delete('/:id', validate(adminIdParamSchema), adminsController.deleteAdmin);

// PATCH /api/v1/admin/admins/:id/toggle-status - Toggle admin active status
router.patch('/:id/toggle-status', validate(adminIdParamSchema), adminsController.toggleAdminStatus);

export default router;
