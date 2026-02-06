import { Router } from 'express';
import authRoutes from './auth.routes.js';
import servicesRoutes from './services.routes.js';
import staffRoutes from './staff.routes.js';
import notificationsRoutes from './notifications.routes.js';
import bookingsRoutes from './bookings.routes.js';
import usersRoutes from './users.routes.js';
import statsRoutes from './stats.routes.js';
import unavailabilityRoutes from './unavailability.routes.js';
import adminsRoutes from './admins.routes.js';

const router = Router();

// Mount admin routes
router.use('/auth', authRoutes);
router.use('/services', servicesRoutes);
router.use('/staff', staffRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);
router.use('/unavailability', unavailabilityRoutes);
router.use('/admins', adminsRoutes);

export default router;
