import { z } from 'zod';

export const sendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
    countryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Invalid country code format')
      .default('+91'),
    purpose: z.enum(['login', 'register'], {
      errorMap: () => ({ message: 'Purpose must be either login or register' }),
    }),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
    countryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Invalid country code format')
      .default('+91'),
    otp: z
      .string()
      .length(4, 'OTP must be exactly 4 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
    purpose: z.enum(['login', 'register']),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
    countryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Invalid country code format')
      .default('+91'),
    otp: z
      .string()
      .length(4, 'OTP must be exactly 4 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const firebaseLoginSchema = z.object({
  body: z.object({
    firebaseIdToken: z.string().min(1, 'Firebase ID token is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
  }),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type FirebaseLoginInput = z.infer<typeof firebaseLoginSchema>['body'];
