import mongoose, { Schema } from 'mongoose';
import { INotificationPreferences } from '../interfaces/admin.interface.js';

const NotificationPreferencesSchema: Schema = new Schema<INotificationPreferences>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      unique: true,
    },
    emailNewUser: {
      type: Boolean,
      default: true,
    },
    emailNewBooking: {
      type: Boolean,
      default: true,
    },
    emailBookingCancelled: {
      type: Boolean,
      default: true,
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
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

export default mongoose.model<INotificationPreferences>(
  'NotificationPreferences',
  NotificationPreferencesSchema
);
