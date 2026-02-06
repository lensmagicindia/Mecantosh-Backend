import mongoose, { Schema } from 'mongoose';
import { IService } from '../interfaces/service.interface.js';

const ServiceSchema: Schema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Service slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [150, 'Short description cannot exceed 150 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    category: {
      type: String,
      enum: ['basic', 'premium', 'detailing'],
      required: [true, 'Category is required'],
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

// Index for active services sorted by order
ServiceSchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for formatted duration
ServiceSchema.virtual('durationFormatted').get(function (this: IService) {
  const hours = Math.floor(this.durationMinutes / 60);
  const minutes = this.durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} mins`;
  } else if (minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    return `${hours}.${Math.round((minutes / 60) * 10)} hours`;
  }
});

export default mongoose.model<IService>('Service', ServiceSchema);
