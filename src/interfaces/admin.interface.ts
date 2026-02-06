import { Document, Types } from 'mongoose';

export type AdminRole = 'admin' | 'super_admin';

export type AdminNotificationType =
  | 'new_user'
  | 'new_booking'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'abandoned_booking';

export interface IAdminUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAdminUserResponse {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

export interface IStaffConfig extends Document {
  _id: Types.ObjectId;
  totalStaff: number;
  serviceDurationMinutes: number;
  operatingStartTime: string;
  operatingEndTime: string;
  bookingWindowDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffConfigResponse {
  totalStaff: number;
  serviceDurationMinutes: number;
  operatingStartTime: string;
  operatingEndTime: string;
  bookingWindowDays: number;
}

export interface IAdminNotification extends Document {
  _id: Types.ObjectId;
  type: AdminNotificationType;
  title: string;
  message: string;
  data: {
    userId?: string;
    userName?: string;
    bookingId?: string;
    bookingNumber?: string;
    reason?: string;
    step?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminNotificationResponse {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  data: {
    userId?: string;
    userName?: string;
    bookingId?: string;
    bookingNumber?: string;
    reason?: string;
    step?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

export interface INotificationPreferences extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  emailNewUser: boolean;
  emailNewBooking: boolean;
  emailBookingCancelled: boolean;
  inAppEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreferencesResponse {
  emailNewUser: boolean;
  emailNewBooking: boolean;
  emailBookingCancelled: boolean;
  inAppEnabled: boolean;
}

export interface IAdminRefreshToken extends Document {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IAdminAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IStaffBooking {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  staffAssigned: number;
}

export interface IDailyAvailability {
  date: string;
  bookings: IStaffBooking[];
  availableSlots: {
    time: string;
    availableStaff: number;
  }[];
}
