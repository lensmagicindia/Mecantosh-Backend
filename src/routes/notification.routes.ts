import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  registerDeviceSchema,
  unregisterDeviceSchema,
  createEventSchema,
} from '../validators/notification.validator.js';

const router: Router = Router();

// All routes are protected
router.use(authenticate);

router.post('/register-device', validate(registerDeviceSchema), notificationController.registerDevice);
router.delete('/unregister-device', validate(unregisterDeviceSchema), notificationController.unregisterDevice);

// Create admin notification event (used by customer app for abandoned bookings, etc.)
router.post('/event', validate(createEventSchema), notificationController.createEvent);

export default router;
