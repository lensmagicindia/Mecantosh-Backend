import { z } from 'zod';

const bookingStatuses = ['upcoming', 'completed', 'cancelled'] as const;

export const createBookingSchema = z.object({
  body: z.object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    serviceId: z.string().min(1, 'Service ID is required'),
    scheduledDate: z
      .string()
      .min(1, 'Scheduled date is required')
      .refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }, 'Invalid date format'),
    scheduledTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    location: z.object({
      address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
      city: z.string().max(100, 'City name too long').optional(),
      state: z.string().max(100, 'State name too long').optional(),
      zipCode: z.string().max(20, 'Zip code too long').optional(),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
        .optional(),
    }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const updateBookingSchema = z.object({
  body: z.object({
    scheduledDate: z
      .string()
      .refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }, 'Invalid date format')
      .optional(),
    scheduledTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export const getBookingsSchema = z.object({
  query: z.object({
    status: z.enum(bookingStatuses).optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1))
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1).max(50))
      .optional()
      .default('10'),
  }),
});

export const checkAvailabilitySchema = z.object({
  query: z.object({
    date: z
      .string()
      .min(1, 'Date is required')
      .refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }, 'Invalid date format'),
    serviceId: z.string().min(1, 'Service ID is required'),
  }),
});

export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>['body'];
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>['body'];
export type GetBookingsQuery = z.infer<typeof getBookingsSchema>['query'];
export type CheckAvailabilityQuery = z.infer<typeof checkAvailabilitySchema>['query'];
