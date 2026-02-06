import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { bookingLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getBookingsSchema,
  checkAvailabilitySchema,
  bookingIdSchema,
} from '../validators/booking.validator.js';

const router = Router();

// All routes are protected
router.use(authenticate);

// Slot availability (must be before /:id route)
router.get('/slots/availability', validate(checkAvailabilitySchema), bookingController.checkAvailability);

router.get('/', validate(getBookingsSchema), bookingController.getBookings);
router.post('/', bookingLimiter, validate(createBookingSchema), bookingController.createBooking);
router.get('/:id', validate(bookingIdSchema), bookingController.getBooking);
router.patch('/:id', validate(updateBookingSchema), bookingController.updateBooking);
router.post('/:id/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);

export default router;
