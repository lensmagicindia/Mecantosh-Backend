import mongoose, { Schema } from 'mongoose';
import { IStaffConfig } from '../interfaces/admin.interface.js';

const StaffConfigSchema: Schema = new Schema<IStaffConfig>(
  {
    totalStaff: {
      type: Number,
      required: [true, 'Total staff count is required'],
      min: [1, 'Must have at least 1 staff member'],
      default: 3,
    },
    serviceDurationMinutes: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [15, 'Service duration must be at least 15 minutes'],
      default: 60,
    },
    operatingStartTime: {
      type: String,
      required: [true, 'Operating start time is required'],
      default: '08:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'],
    },
    operatingEndTime: {
      type: String,
      required: [true, 'Operating end time is required'],
      default: '22:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'],
    },
    bookingWindowDays: {
      type: Number,
      default: 7,
      min: [1, 'Booking window must be at least 1 day'],
      max: [90, 'Booking window cannot exceed 90 days'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model<IStaffConfig>('StaffConfig', StaffConfigSchema);
