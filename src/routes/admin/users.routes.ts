import { Router } from 'express';
import * as usersController from '../../controllers/admin/users.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';

const router = Router();

// All routes require admin authentication and users permission
router.use(authenticateAdmin);
router.use(requirePermission('users'));

// User routes
router.get('/', usersController.getUsers);
router.get('/export', usersController.exportUsers);
router.get('/:id', usersController.getUserById);

export default router;
