import { Router } from 'express';
import * as notificationsController from '../../controllers/admin/notifications.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { updateNotificationPreferencesSchema } from '../../validators/admin.validator.js';

const router: Router = Router();

// All routes require admin authentication and notifications permission
router.use(authenticateAdmin);
router.use(requirePermission('notifications'));

// Notification routes
router.get('/', notificationsController.getNotifications);
router.get('/recent', notificationsController.getRecentNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.post('/mark-all-read', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);

// Preferences routes
router.get('/preferences', notificationsController.getPreferences);
router.patch(
  '/preferences',
  validate(updateNotificationPreferencesSchema),
  notificationsController.updatePreferences
);

export default router;
