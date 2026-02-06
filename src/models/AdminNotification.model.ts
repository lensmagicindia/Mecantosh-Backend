import mongoose, { Schema } from 'mongoose';
import { IAdminNotification } from '../interfaces/admin.interface.js';

const AdminNotificationSchema: Schema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ['new_user', 'new_booking', 'booking_cancelled', 'booking_completed', 'abandoned_booking'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    data: {
      userId: { type: String },
      userName: { type: String },
      bookingId: { type: String },
      bookingNumber: { type: String },
      reason: { type: String },
      step: { type: String },
    },
    isRead: {
      type: Boolean,
      default: false,
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

// Index for unread notifications and sorting by creation date
AdminNotificationSchema.index({ isRead: 1, createdAt: -1 });
AdminNotificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
