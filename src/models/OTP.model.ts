import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IOTP } from '../interfaces/auth.interface.js';

const OTPSchema: Schema = new Schema<IOTP>(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    purpose: {
      type: String,
      enum: ['login', 'register'],
      required: [true, 'Purpose is required'],
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
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

// TTL index - automatically delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for lookups
OTPSchema.index({ phone: 1, countryCode: 1, purpose: 1 });

// Hash OTP before saving
OTPSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp as string, salt);
  }
  next();
});

// Method to compare OTP
OTPSchema.methods.compareOTP = async function (candidateOTP: string): Promise<boolean> {
  return bcrypt.compare(candidateOTP, this.otp);
};

export default mongoose.model<IOTP>('OTP', OTPSchema);
