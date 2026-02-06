import { z } from 'zod';

const platforms = ['ios', 'android', 'web'] as const;

const notificationTypes = [
  'new_user',
  'new_booking',
  'booking_cancelled',
  'booking_completed',
  'abandoned_booking',
] as const;

export const registerDeviceSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(1, 'FCM token is required'),
    platform: z.enum(platforms, {
      errorMap: () => ({ message: 'Platform must be ios, android, or web' }),
    }),
  }),
});

export const unregisterDeviceSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(1, 'FCM token is required'),
  }),
});

export const createEventSchema = z.object({
  body: z.object({
    type: z.enum(notificationTypes, {
      errorMap: () => ({ message: 'Invalid notification type' }),
    }),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
    data: z
      .object({
        userId: z.string().optional(),
        userName: z.string().optional(),
        userPhone: z.string().optional(),
        bookingId: z.string().optional(),
        bookingNumber: z.string().optional(),
        serviceName: z.string().optional(),
        reason: z.string().optional(),
        step: z.string().optional(),
      })
      .optional(),
  }),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>['body'];
export type UnregisterDeviceInput = z.infer<typeof unregisterDeviceSchema>['body'];
export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
