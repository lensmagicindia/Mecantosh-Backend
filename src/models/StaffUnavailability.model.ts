import mongoose, { Schema, Document, Types } from 'mongoose';

export type UnavailabilityType = 'full_day' | 'time_slot';

export interface IStaffUnavailability extends Document {
  _id: Types.ObjectId;
  date: Date;
  type: UnavailabilityType;
  timeSlots?: string[];
  unavailableCount: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffUnavailabilityResponse {
  id: string;
  date: string;
  type: UnavailabilityType;
  timeSlots?: string[];
  unavailableCount: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffUnavailabilitySchema: Schema = new Schema<IStaffUnavailability>(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['full_day', 'time_slot'],
      required: [true, 'Unavailability type is required'],
      default: 'full_day',
    },
    timeSlots: {
      type: [String],
      validate: {
        validator: function (this: IStaffUnavailability, v: string[]) {
          // If type is time_slot, timeSlots must have at least one entry
          if (this.type === 'time_slot') {
            return v && v.length > 0;
          }
          return true;
        },
        message: 'Time slots are required when type is time_slot',
      },
    },
    unavailableCount: {
      type: Number,
      required: [true, 'Unavailable count is required'],
      min: [1, 'At least 1 staff must be unavailable'],
      default: 1,
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
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

// Compound index for efficient date + type queries
StaffUnavailabilitySchema.index({ date: 1, type: 1 });

export default mongoose.model<IStaffUnavailability>('StaffUnavailability', StaffUnavailabilitySchema);
