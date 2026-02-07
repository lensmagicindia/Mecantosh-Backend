import { RequestHandler } from 'express';
import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UpdateUserInput } from '../validators/user.validator.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/me
 * @access  Private
 */
export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.userId!);

  return ApiResponse.ok(res, 'User profile retrieved', user);
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/v1/users/me
 * @access  Private
 */
export const updateMe: RequestHandler = asyncHandler(async (req, res) => {
  const updates = req.body as UpdateUserInput;

  const user = await userService.updateUser(req.userId!, updates);

  return ApiResponse.ok(res, 'Profile updated successfully', user);
});

/**
 * @desc    Upload profile image
 * @route   POST /api/v1/users/me/profile-image
 * @access  Private
 */
export const uploadProfileImage: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 400, 'No image file provided');
  }

  const user = await userService.updateProfileImage(req.userId!, req.file.path);

  return ApiResponse.ok(res, 'Profile image uploaded successfully', {
    profileImage: user.profileImage,
  });
});

/**
 * @desc    Remove profile image
 * @route   DELETE /api/v1/users/me/profile-image
 * @access  Private
 */
export const removeProfileImage: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.removeProfileImage(req.userId!);

  return ApiResponse.ok(res, 'Profile image removed', user);
});

/**
 * @desc    Deactivate account
 * @route   DELETE /api/v1/users/me
 * @access  Private
 */
export const deactivateAccount: RequestHandler = asyncHandler(async (req, res) => {
  await userService.deactivateAccount(req.userId!);

  return ApiResponse.ok(res, 'Account deactivated successfully');
});
