import OTP from '../models/OTP.model.js';
import { config } from '../config/index.js';
import { generateOTP } from '../utils/helpers.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { MAX_OTP_ATTEMPTS } from '../utils/constants.js';
import { OTPPurpose } from '../interfaces/auth.interface.js';

class OTPService {
  /**
   * Generate and save OTP
   */
  async generateOTP(
    phone: string,
    countryCode: string,
    purpose: OTPPurpose
  ): Promise<{ otp: string; expiresAt: Date }> {
    // Delete any existing OTPs for this phone and purpose
    await OTP.deleteMany({ phone, countryCode, purpose });

    // Generate new OTP
    const otp = generateOTP(config.otp.length);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // Save OTP (will be hashed by pre-save hook)
    await OTP.create({
      phone,
      countryCode,
      otp,
      purpose,
      expiresAt,
    });

    // Log OTP in development mode
    if (config.nodeEnv === 'development') {
      logger.info(`[DEV] OTP for ${countryCode}${phone}: ${otp}`);
    }

    return { otp, expiresAt };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    phone: string,
    countryCode: string,
    otp: string,
    purpose: OTPPurpose
  ): Promise<boolean> {
    const otpRecord = await OTP.findOne({
      phone,
      countryCode,
      purpose,
      isVerified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw ApiError.badRequest('No OTP found. Please request a new one.');
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('Maximum OTP attempts exceeded. Please request a new one.');
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    const isValid = await (otpRecord as any).compareOTP(otp);

    if (!isValid) {
      const remainingAttempts = MAX_OTP_ATTEMPTS - otpRecord.attempts;
      throw ApiError.badRequest(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      );
    }

    // Mark as verified and delete
    otpRecord.isVerified = true;
    await otpRecord.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    return true;
  }

  /**
   * Check if user can request new OTP (rate limiting)
   */
  async canRequestOTP(
    phone: string,
    countryCode: string,
    purpose: OTPPurpose
  ): Promise<{ canRequest: boolean; retryAfter?: number }> {
    const recentOTP = await OTP.findOne({
      phone,
      countryCode,
      purpose,
    }).sort({ createdAt: -1 });

    if (!recentOTP) {
      return { canRequest: true };
    }

    // Allow new OTP after 60 seconds
    const timeSinceCreation = Date.now() - recentOTP.createdAt.getTime();
    const cooldownMs = 60 * 1000; // 60 seconds

    if (timeSinceCreation < cooldownMs) {
      return {
        canRequest: false,
        retryAfter: Math.ceil((cooldownMs - timeSinceCreation) / 1000),
      };
    }

    return { canRequest: true };
  }
}

export const otpService = new OTPService();
export default otpService;
