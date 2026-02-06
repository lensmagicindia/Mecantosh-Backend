import mongoose, { Schema } from 'mongoose';
import { IAdminRefreshToken } from '../interfaces/admin.interface.js';

const AdminRefreshTokenSchema: Schema = new Schema<IAdminRefreshToken>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup of expired tokens
AdminRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IAdminRefreshToken>('AdminRefreshToken', AdminRefreshTokenSchema);
