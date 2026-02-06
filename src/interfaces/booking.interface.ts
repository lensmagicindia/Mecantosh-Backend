import { Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface IBookingLocation {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ITimeSlot {
  start: string;
  end: string;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  bookingNumber: string;
  user: Types.ObjectId;
  vehicle: Types.ObjectId;
  service: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  timeSlot: ITimeSlot;
  location: IBookingLocation;
  status: BookingStatus;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingResponse {
  id: string;
  bookingNumber: string;
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  };
  vehicle: {
    id: string;
    name: string;
    licensePlate: string;
    image?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  timeSlot: ITimeSlot;
  location: IBookingLocation;
  status: BookingStatus;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ISlotAvailability {
  time: string;
  display: string;
  available: boolean;
  staffCount: number;
}
