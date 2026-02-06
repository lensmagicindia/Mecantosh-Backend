import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import vehicleRoutes from './vehicle.routes.js';
import serviceRoutes from './service.routes.js';
import bookingRoutes from './booking.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Mecantosh API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;
