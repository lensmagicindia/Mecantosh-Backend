import { z } from 'zod';

// Admin Auth Validators
export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const adminRefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Admin Services Validators
export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().max(150, 'Short description cannot exceed 150 characters').optional(),
    price: z.number().min(0, 'Price cannot be negative'),
    duration: z.number().min(15, 'Duration must be at least 15 minutes'),
    durationMinutes: z.number().min(15, 'Duration must be at least 15 minutes').optional(),
    category: z.enum(['basic', 'premium', 'detailing']).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).optional(),
    shortDescription: z.string().max(150).optional(),
    price: z.number().min(0).optional(),
    duration: z.number().min(15).optional(),
    durationMinutes: z.number().min(15).optional(),
    category: z.enum(['basic', 'premium', 'detailing']).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().min(0).optional(),
    sortOrder: z.number().min(0).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Service ID is required'),
  }),
});

export const reorderServicesSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()).min(1, 'At least one service ID is required'),
  }),
});

// Staff Config Validators
export const updateStaffConfigSchema = z.object({
  body: z.object({
    totalStaff: z.number().min(1, 'Must have at least 1 staff member').optional(),
    serviceDurationMinutes: z.number().min(15, 'Duration must be at least 15 minutes').optional(),
    operatingStartTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)')
      .optional(),
    operatingEndTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)')
      .optional(),
    bookingWindowDays: z.number().min(1, 'Must be at least 1 day').max(90, 'Cannot exceed 90 days').optional(),
  }),
});

// Staff Unavailability Validators
export const createUnavailabilitySchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
    type: z.enum(['full_day', 'time_slot']),
    timeSlots: z
      .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'))
      .optional(),
    unavailableCount: z.number().min(1, 'At least 1 staff must be unavailable').default(1),
    reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
  }).refine(
    (data) => {
      if (data.type === 'time_slot') {
        return data.timeSlots && data.timeSlots.length > 0;
      }
      return true;
    },
    { message: 'Time slots are required when type is time_slot', path: ['timeSlots'] }
  ),
});

export const updateUnavailabilitySchema = z.object({
  body: z.object({
    type: z.enum(['full_day', 'time_slot']).optional(),
    timeSlots: z
      .array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'))
      .optional(),
    unavailableCount: z.number().min(1, 'At least 1 staff must be unavailable').optional(),
    reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Unavailability ID is required'),
  }),
});

export const unavailabilityDateParamSchema = z.object({
  params: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  }),
});

export const unavailabilityIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Unavailability ID is required'),
  }),
});

export const unavailabilityListQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  }),
});

export const unavailabilityDatesQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  }),
});

export const dateParamSchema = z.object({
  params: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  }),
});

// Notification Validators
export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    type: z
      .enum(['new_user', 'new_booking', 'booking_cancelled', 'booking_completed', 'abandoned_booking'])
      .optional(),
  }),
});

export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    emailNewUser: z.boolean().optional(),
    emailNewBooking: z.boolean().optional(),
    emailBookingCancelled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
  }),
});

// Admin Bookings Validators
export const getAdminBookingsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'upcoming']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
    search: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

// Admin User Management Validators
const permissionEnum = z.enum([
  'staff',
  'users',
  'bookings',
  'services',
  'settings',
  'notifications',
  'admins',
]);

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
    role: z.enum(['admin', 'super_admin']).default('admin'),
    permissions: z.array(permissionEnum).default([]),
    isActive: z.boolean().default(true),
  }),
});

export const updateAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    name: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'super_admin']).optional(),
    permissions: z.array(permissionEnum).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Admin ID is required'),
  }),
});

export const adminIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Admin ID is required'),
  }),
});

export const getAdminsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    search: z.string().optional(),
    role: z.enum(['admin', 'super_admin']).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// Type exports
export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
export type AdminRefreshTokenInput = z.infer<typeof adminRefreshTokenSchema>['body'];
export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];
export type ReorderServicesInput = z.infer<typeof reorderServicesSchema>['body'];
export type UpdateStaffConfigInput = z.infer<typeof updateStaffConfigSchema>['body'];
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>['body'];
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>['body'];
export type CreateAdminInput = z.infer<typeof createAdminSchema>['body'];
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>['body'];
export type GetAdminsQueryInput = z.infer<typeof getAdminsQuerySchema>['query'];
