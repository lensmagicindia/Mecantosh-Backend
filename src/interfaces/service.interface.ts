import { Document, Types } from 'mongoose';

export type ServiceCategory = 'basic' | 'premium' | 'detailing';

export interface IService extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  durationMinutes: number;
  category: ServiceCategory;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  durationMinutes: number;
  durationFormatted: string;
  category: ServiceCategory;
  features: string[];
}
