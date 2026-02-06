import { Request, Response } from 'express';
import { adminNotificationsService } from '../../services/admin/notifications.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UpdateNotificationPreferencesInput } from '../../validators/admin.validator.js';
import { AdminNotificationType } from '../../interfaces/admin.interface.js';

/**
 * @desc    Get paginated notifications
 * @route   GET /api/v1/admin/notifications
 * @access  Private (Admin)
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as AdminNotificationType | undefined;

  const result = await adminNotificationsService.getNotifications({ page, limit, type });

  return ApiResponse.ok(res, 'Notifications retrieved', result);
});

/**
 * @desc    Get recent notifications
 * @route   GET /api/v1/admin/notifications/recent
 * @access  Private (Admin)
 */
export const getRecentNotifications = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const notifications = await adminNotificationsService.getRecentNotifications(limit);

  return ApiResponse.ok(res, 'Recent notifications retrieved', { notifications });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/v1/admin/notifications/unread-count
 * @access  Private (Admin)
 */
export const getUnreadCount = asyncHandler(async (_req: Request, res: Response) => {
  const count = await adminNotificationsService.getUnreadCount();

  return ApiResponse.ok(res, 'Unread count retrieved', { count });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/admin/notifications/:id/read
 * @access  Private (Admin)
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await adminNotificationsService.markAsRead(id);

  return ApiResponse.ok(res, 'Notification marked as read');
});

/**
 * @desc    Mark all notifications as read
 * @route   POST /api/v1/admin/notifications/mark-all-read
 * @access  Private (Admin)
 */
export const markAllAsRead = asyncHandler(async (_req: Request, res: Response) => {
  await adminNotificationsService.markAllAsRead();

  return ApiResponse.ok(res, 'All notifications marked as read');
});

/**
 * @desc    Get notification preferences
 * @route   GET /api/v1/admin/notifications/preferences
 * @access  Private (Admin)
 */
export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.adminId!;

  const preferences = await adminNotificationsService.getPreferences(adminId);

  return ApiResponse.ok(res, 'Notification preferences retrieved', preferences);
});

/**
 * @desc    Update notification preferences
 * @route   PATCH /api/v1/admin/notifications/preferences
 * @access  Private (Admin)
 */
export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.adminId!;
  const data = req.body as UpdateNotificationPreferencesInput;

  const preferences = await adminNotificationsService.updatePreferences(adminId, data);

  return ApiResponse.ok(res, 'Notification preferences updated', preferences);
});
