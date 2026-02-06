import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { otpService } from './otp.service.js';
import { smsService } from './sms.service.js';
import { tokenService } from './token.service.js';
import { IUser, IUserResponse } from '../interfaces/user.interface.js';
import { IAuthTokens, OTPPurpose } from '../interfaces/auth.interface.js';
import { getAuth } from '../config/firebase.js';
import logger from '../utils/logger.js';

class AuthService {
  /**
   * Send OTP to phone number
   */
  async sendOTP(
    phone: string,
    countryCode: string,
    purpose: OTPPurpose
  ): Promise<{ expiresIn: number; retryAfter: number }> {
    // Check if user can request OTP
    const { canRequest, retryAfter } = await otpService.canRequestOTP(
      phone,
      countryCode,
      purpose
    );

    if (!canRequest) {
      throw ApiError.tooManyRequests(
        `Please wait ${retryAfter} seconds before requesting a new OTP`
      );
    }

    // Check if user exists for login
    if (purpose === 'login') {
      const user = await User.findOne({ phone, countryCode });
      if (!user) {
        throw ApiError.notFound('User not found. Please register first.');
      }
      if (!user.isActive) {
        throw ApiError.unauthorized('Account has been deactivated');
      }
    }

    // Check if user already exists for registration
    if (purpose === 'register') {
      const existingUser = await User.findOne({ phone, countryCode });
      if (existingUser) {
        throw ApiError.conflict('User already exists. Please login instead.');
      }
    }

    // Generate and send OTP
    const { otp, expiresAt } = await otpService.generateOTP(phone, countryCode, purpose);
    await smsService.sendOTP(phone, countryCode, otp);

    const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);

    return {
      expiresIn,
      retryAfter: 60,
    };
  }

  /**
   * Verify OTP and login
   */
  async verifyOTPAndLogin(
    phone: string,
    countryCode: string,
    otp: string
  ): Promise<{ user: IUserResponse; tokens: IAuthTokens }> {
    // Verify OTP
    await otpService.verifyOTP(phone, countryCode, otp, 'login');

    // Get user
    const user = await User.findOne({ phone, countryCode });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update phone verified status
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user._id.toString());

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Register new user
   */
  async register(
    phone: string,
    countryCode: string,
    otp: string,
    name: string,
    email?: string
  ): Promise<{ user: IUserResponse; tokens: IAuthTokens }> {
    // Verify OTP
    await otpService.verifyOTP(phone, countryCode, otp, 'register');

    // Check if user already exists
    const existingUser = await User.findOne({ phone, countryCode });
    if (existingUser) {
      throw ApiError.conflict('User already exists');
    }

    // Create user
    const user = await User.create({
      phone,
      countryCode,
      name,
      email: email || undefined,
      isPhoneVerified: true,
    });

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user._id.toString());

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Login or register using Firebase Phone Auth token
   */
  async firebaseLogin(
    firebaseIdToken: string,
    name?: string,
    email?: string
  ): Promise<{ user: IUserResponse; tokens: IAuthTokens; isNewUser: boolean }> {
    const auth = getAuth();
    if (!auth) {
      throw ApiError.internal('Firebase not configured');
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(firebaseIdToken);
    } catch (error) {
      logger.error('Firebase token verification failed:', error);
      throw ApiError.unauthorized('Invalid or expired token');
    }

    // Extract phone number from Firebase token
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      throw ApiError.badRequest('Phone number not found in token');
    }

    // Parse phone number (format: +[country code][number])
    // Supports variable length country codes (+1, +44, +91, +971, etc.)
    const match = phoneNumber.match(/^(\+\d{1,4})(\d+)$/);
    if (!match) {
      throw ApiError.badRequest('Invalid phone number format');
    }
    const countryCode = match[1];
    const phone = match[2];

    // Check if user exists
    let user = await User.findOne({ phone, countryCode });
    let isNewUser = false;

    if (user) {
      // Existing user - login
      if (!user.isActive) {
        throw ApiError.unauthorized('Account has been deactivated');
      }

      // Update phone verified status if needed
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }
    } else {
      // New user - register
      if (!name || name.trim() === '') {
        throw ApiError.badRequest('Name is required for new users');
      }

      user = await User.create({
        phone,
        countryCode,
        name: name.trim(),
        email: email || undefined,
        isPhoneVerified: true,
      });

      isNewUser = true;
    }

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user._id.toString());

    return {
      user: this.formatUserResponse(user),
      tokens,
      isNewUser,
    };
  }

  /**
   * Refresh tokens
   */
  async refreshToken(refreshToken: string): Promise<IAuthTokens> {
    return tokenService.refreshTokens(refreshToken);
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeToken(refreshToken);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await tokenService.revokeAllUserTokens(userId);
  }

  /**
   * Format user for response
   */
  private formatUserResponse(user: IUser): IUserResponse {
    return {
      id: user._id.toString(),
      phone: user.phone,
      countryCode: user.countryCode,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
export default authService;
