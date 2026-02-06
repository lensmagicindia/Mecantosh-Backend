import { Document, Types } from 'mongoose';

export type OTPPurpose = 'login' | 'register';

export interface IOTP extends Document {
  _id: Types.ObjectId;
  phone: string;
  countryCode: string;
  otp: string;
  purpose: OTPPurpose;
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  token: string;
  deviceInfo?: {
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

export interface IDeviceToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  fcmToken: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ISendOTPRequest {
  phone: string;
  countryCode?: string;
  purpose: OTPPurpose;
}

export interface IVerifyOTPRequest {
  phone: string;
  countryCode?: string;
  otp: string;
  purpose: OTPPurpose;
}

export interface IRegisterRequest {
  phone: string;
  countryCode?: string;
  otp: string;
  name: string;
  email?: string;
}
