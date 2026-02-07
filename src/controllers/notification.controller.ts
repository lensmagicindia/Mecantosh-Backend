import { RequestHandler } from 'express';
import { notificationService } from '../services/notification.service.js';
import { adminNotificationsService } from '../services/admin/notifications.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  RegisterDeviceInput,
  UnregisterDeviceInput,
  CreateEventInput,
} from '../validators/notification.validator.js';

/**
 * @desc    Register device for push notifications
 * @route   POST /api/v1/notifications/register-device
 * @access  Private
 */
export const registerDevice: RequestHandler = asyncHandler(async (req, res) => {
  const { fcmToken, platform } = req.body as RegisterDeviceInput;

  await notificationService.registerDevice(req.userId!, fcmToken, platform);

  return ApiResponse.ok(res, 'Device registered for notifications');
});

/**
 * @desc    Unregister device
 * @route   DELETE /api/v1/notifications/unregister-device
 * @access  Private
 */
export const unregisterDevice: RequestHandler = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body as UnregisterDeviceInput;

  await notificationService.unregisterDevice(req.userId!, fcmToken);

  return ApiResponse.ok(res, 'Device unregistered');
});

/**
 * @desc    Create admin notification event (from customer app)
 * @route   POST /api/v1/notifications/event
 * @access  Private (Customer auth)
 */
export const createEvent: RequestHandler = asyncHandler(async (req, res) => {
  const { type, title, message, data } = req.body as CreateEventInput;

  const notification = await adminNotificationsService.createNotification({
    type,
    title,
    message,
    data,
  });

  return ApiResponse.created(res, 'Notification created', notification);
});
