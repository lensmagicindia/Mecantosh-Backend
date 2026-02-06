import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { IUser, IUserResponse } from '../interfaces/user.interface.js';
import fs from 'fs/promises';
import path from 'path';

class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return this.formatUserResponse(user);
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<IUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update fields
    if (updates.name) {
      user.name = updates.name;
    }
    if (updates.email !== undefined) {
      user.email = updates.email || undefined;
    }

    await user.save();
    return this.formatUserResponse(user);
  }

  /**
   * Update profile image
   */
  async updateProfileImage(userId: string, imagePath: string): Promise<IUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Delete old image if exists
    if (user.profileImage) {
      try {
        await fs.unlink(user.profileImage);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    user.profileImage = imagePath;
    await user.save();

    return this.formatUserResponse(user);
  }

  /**
   * Remove profile image
   */
  async removeProfileImage(userId: string): Promise<IUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Delete image file if exists
    if (user.profileImage) {
      try {
        await fs.unlink(user.profileImage);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    user.profileImage = undefined;
    await user.save();

    return this.formatUserResponse(user);
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.isActive = false;
    await user.save();
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

export const userService = new UserService();
export default userService;
