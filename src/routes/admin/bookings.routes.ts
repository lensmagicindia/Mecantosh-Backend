import { Router } from 'express';
import * as bookingsController from '../../controllers/admin/bookings.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { updateBookingStatusSchema } from '../../validators/admin.validator.js';

const router = Router();

// All routes require admin authentication and bookings permission
router.use(authenticateAdmin);
router.use(requirePermission('bookings'));

// Booking routes
router.get('/', bookingsController.getBookings);
router.get('/:id', bookingsController.getBookingById);
router.patch('/:id/status', validate(updateBookingStatusSchema), bookingsController.updateBookingStatus);

export default router;
