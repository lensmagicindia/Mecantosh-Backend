import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { IAuthTokens } from '../interfaces/auth.interface.js';
import { ApiError } from '../utils/ApiError.js';

class TokenService {
  /**
   * Generate access token
   */
  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as string,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    userId: string,
    deviceInfo?: { deviceId?: string; platform?: string; appVersion?: string }
  ): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');

    // Parse expiry (e.g., "7d" -> 7 days)
    const expiryMatch = config.jwt.refreshExpiry.match(/^(\d+)([dhms])$/);
    let expiryMs = 7 * 24 * 60 * 60 * 1000; // Default 7 days

    if (expiryMatch) {
      const value = parseInt(expiryMatch[1], 10);
      const unit = expiryMatch[2];
      const multipliers: Record<string, number> = {
        d: 24 * 60 * 60 * 1000,
        h: 60 * 60 * 1000,
        m: 60 * 1000,
        s: 1000,
      };
      expiryMs = value * (multipliers[unit] || multipliers.d);
    }

    const expiresAt = new Date(Date.now() + expiryMs);

    await RefreshToken.create({
      user: userId,
      token,
      deviceInfo,
      expiresAt,
    });

    return token;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(
    userId: string,
    deviceInfo?: { deviceId?: string; platform?: string; appVersion?: string }
  ): Promise<IAuthTokens> {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId, deviceInfo);

    // Parse access token expiry for response
    const expiryMatch = config.jwt.accessExpiry.match(/^(\d+)([dhms])$/);
    let expiresIn = 900; // Default 15 minutes in seconds

    if (expiryMatch) {
      const value = parseInt(expiryMatch[1], 10);
      const unit = expiryMatch[2];
      const multipliers: Record<string, number> = {
        d: 24 * 60 * 60,
        h: 60 * 60,
        m: 60,
        s: 1,
      };
      expiresIn = value * (multipliers[unit] || 60);
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<IAuthTokens> {
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Delete old refresh token
    await RefreshToken.deleteOne({ _id: tokenDoc._id });

    // Generate new token pair
    return this.generateTokenPair(tokenDoc.user.toString(), tokenDoc.deviceInfo);
  }

  /**
   * Revoke refresh token
   */
  async revokeToken(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ user: userId });
  }
}

export const tokenService = new TokenService();
export default tokenService;
