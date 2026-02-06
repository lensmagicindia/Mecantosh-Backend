import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/index.js';
import AdminUser from '../../models/AdminUser.model.js';
import AdminRefreshToken from '../../models/AdminRefreshToken.model.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  IAdminUser,
  IAdminUserResponse,
  IAdminAuthTokens,
} from '../../interfaces/admin.interface.js';

class AdminAuthService {
  /**
   * Login admin user
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: IAdminUserResponse; tokens: IAdminAuthTokens }> {
    // Find admin with password field
    const admin = await AdminUser.findOne({ email }).select('+password');

    if (!admin) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!admin.isActive) {
      throw ApiError.unauthorized('Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate tokens
    const tokens = await this.generateTokenPair(admin._id.toString());

    return {
      user: this.formatAdminResponse(admin),
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<IAdminAuthTokens> {
    const tokenDoc = await AdminRefreshToken.findOne({ token: refreshToken });

    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (tokenDoc.expiresAt < new Date()) {
      await AdminRefreshToken.deleteOne({ _id: tokenDoc._id });
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Verify admin still exists and is active
    const admin = await AdminUser.findById(tokenDoc.admin);
    if (!admin || !admin.isActive) {
      await AdminRefreshToken.deleteOne({ _id: tokenDoc._id });
      throw ApiError.unauthorized('Admin account not found or inactive');
    }

    // Delete old refresh token
    await AdminRefreshToken.deleteOne({ _id: tokenDoc._id });

    // Generate new token pair
    return this.generateTokenPair(tokenDoc.admin.toString());
  }

  /**
   * Logout admin (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await AdminRefreshToken.deleteOne({ token: refreshToken });
  }

  /**
   * Generate access token
   */
  generateAccessToken(adminId: string): string {
    return jwt.sign({ adminId, type: 'admin' }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as string,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(adminId: string): Promise<string> {
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

    await AdminRefreshToken.create({
      admin: adminId,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(adminId: string): Promise<IAdminAuthTokens> {
    const accessToken = this.generateAccessToken(adminId);
    const refreshToken = await this.generateRefreshToken(adminId);

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
   * Format admin for response
   */
  private formatAdminResponse(admin: IAdminUser): IAdminUserResponse {
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;
