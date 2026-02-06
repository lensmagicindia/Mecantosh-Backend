import mongoose, { Schema } from 'mongoose';
import { IDeviceToken } from '../interfaces/auth.interface.js';

const DeviceTokenSchema: Schema = new Schema<IDeviceToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    fcmToken: {
      type: String,
      required: [true, 'FCM token is required'],
      index: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: [true, 'Platform is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one token per user per device
DeviceTokenSchema.index({ user: 1, fcmToken: 1 }, { unique: true });

export default mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
