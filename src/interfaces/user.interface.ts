import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  countryCode: string;
  name: string;
  email?: string;
  profileImage?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  id: string;
  phone: string;
  countryCode: string;
  name: string;
  email?: string;
  profileImage?: string;
  isPhoneVerified: boolean;
  createdAt: Date;
}
