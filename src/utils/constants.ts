export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  HATCHBACK: 'hatchback',
  TRUCK: 'truck',
  VAN: 'van',
  OTHER: 'other',
} as const;

export const SERVICE_CATEGORIES = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  DETAILING: 'detailing',
} as const;

export const OTP_PURPOSE = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const;

export const DEVICE_PLATFORMS = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;

export const TIME_SLOTS = {
  MORNING: {
    label: 'Morning',
    slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  },
  AFTERNOON: {
    label: 'Afternoon',
    slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
  EVENING: {
    label: 'Evening',
    slots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  },
  NIGHT: {
    label: 'Night',
    slots: ['20:00', '20:30', '21:00'],
  },
} as const;

export const DEFAULT_SERVICE_FEE = 3.0;
export const DEFAULT_TAX_RATE = 0.0;
export const MAX_BOOKINGS_PER_SLOT = 3;
export const OTP_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 5;

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};
