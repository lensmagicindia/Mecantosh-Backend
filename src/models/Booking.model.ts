import mongoose, { Schema } from 'mongoose';
import { IBooking, IBookingLocation, ITimeSlot } from '../interfaces/booking.interface.js';
import { generateBookingNumber } from '../utils/helpers.js';

const BookingLocationSchema = new Schema<IBookingLocation>(
  {
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { _id: false }
);

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const BookingSchema: Schema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
    },
    timeSlot: {
      type: TimeSlotSchema,
      required: true,
    },
    location: {
      type: BookingLocationSchema,
      required: [true, 'Location is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
    },
    serviceFee: {
      type: Number,
      default: 3.0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancellationReason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
BookingSchema.index({ user: 1, status: 1, scheduledDate: -1 });
BookingSchema.index({ scheduledDate: 1, status: 1 });
BookingSchema.index({ scheduledDate: 1, scheduledTime: 1, status: 1 });

// Pre-save hook to generate booking number
BookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookingNumber) {
    this.bookingNumber = generateBookingNumber();
  }
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
