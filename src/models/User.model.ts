import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface.js';

const UserSchema: Schema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
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
    toObject: { virtuals: true },
  }
);

// Compound index for phone lookups
UserSchema.index({ phone: 1, countryCode: 1 });

// Virtual for full phone number
UserSchema.virtual('fullPhone').get(function (this: IUser) {
  return `${this.countryCode}${this.phone}`;
});

export default mongoose.model<IUser>('User', UserSchema);
