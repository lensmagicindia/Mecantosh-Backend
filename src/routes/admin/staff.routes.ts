import { Router } from 'express';
import * as staffController from '../../controllers/admin/staff.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { updateStaffConfigSchema, dateParamSchema } from '../../validators/admin.validator.js';

const router = Router();

// All routes require admin authentication and staff permission
router.use(authenticateAdmin);
router.use(requirePermission('staff'));

// Staff config routes
router.get('/config', staffController.getStaffConfig);
router.patch('/config', validate(updateStaffConfigSchema), staffController.updateStaffConfig);

// Availability and bookings routes
router.get('/availability/:date', validate(dateParamSchema), staffController.getDailyAvailability);
router.get('/bookings/:date', validate(dateParamSchema), staffController.getBookingsForDate);

export default router;
