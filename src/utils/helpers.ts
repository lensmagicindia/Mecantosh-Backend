import crypto from 'crypto';
import { OTP_LENGTH } from './constants.js';

/**
 * Generate a random OTP of specified length
 */
export const generateOTP = (length: number = OTP_LENGTH): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generate a unique booking number
 */
export const generateBookingNumber = (): string => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CW-${randomPart}`;
};

/**
 * Format phone number (remove spaces and special characters)
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format time slot for display (24h to 12h format)
 */
export const formatTimeSlot = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Calculate end time based on start time and duration
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

/**
 * Paginate array results
 */
export const paginate = <T>(
  items: T[],
  page: number,
  limit: number
): {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} => {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages,
    },
  };
};

/**
 * Create slug from string
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
