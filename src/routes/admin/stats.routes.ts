import { Router } from 'express';
import * as statsController from '../../controllers/admin/stats.controller.js';
import { authenticateAdmin } from '../../middleware/adminAuth.middleware.js';

const router: Router = Router();

// All stats routes require admin authentication
router.use(authenticateAdmin);

// GET /admin/stats - Dashboard stats
router.get('/', statsController.getStats);

// GET /admin/stats/bookings-chart - Bookings chart data
router.get('/bookings-chart', statsController.getBookingsChart);

// GET /admin/stats/revenue-chart - Revenue chart data
router.get('/revenue-chart', statsController.getRevenueChart);

// GET /admin/stats/users-chart - Users chart data
router.get('/users-chart', statsController.getUsersChart);

// GET /admin/stats/recent-activity - Recent activity feed
router.get('/recent-activity', statsController.getRecentActivity);

export default router;
