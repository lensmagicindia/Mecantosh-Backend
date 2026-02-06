import { Document, Types } from 'mongoose';

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'truck' | 'van' | 'other';

export interface IVehicle extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  licensePlate: string;
  make?: string;
  vehicleModel?: string;
  year?: number;
  color?: string;
  vehicleType: VehicleType;
  image?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicleResponse {
  id: string;
  name: string;
  licensePlate: string;
  make?: string;
  vehicleModel?: string;
  year?: number;
  color?: string;
  vehicleType: VehicleType;
  image?: string;
  isDefault: boolean;
  createdAt: Date;
}
