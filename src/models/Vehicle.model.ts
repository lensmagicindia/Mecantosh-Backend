import mongoose, { Schema } from 'mongoose';
import { IVehicle } from '../interfaces/vehicle.interface.js';

const VehicleSchema: Schema = new Schema<IVehicle>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
      maxlength: [50, 'Vehicle name cannot exceed 50 characters'],
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      trim: true,
      uppercase: true,
    },
    make: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    color: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'hatchback', 'truck', 'van', 'other'],
      default: 'sedan',
    },
    image: {
      type: String,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Compound index for user's vehicles
VehicleSchema.index({ user: 1, isActive: 1 });

// Ensure only one default vehicle per user
VehicleSchema.index(
  { user: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
