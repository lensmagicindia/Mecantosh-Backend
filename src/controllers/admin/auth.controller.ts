import { Request, Response } from 'express';
import { adminAuthService } from '../../services/admin/auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AdminLoginInput, AdminRefreshTokenInput } from '../../validators/admin.validator.js';

/**
 * @desc    Admin login
 * @route   POST /api/v1/admin/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as AdminLoginInput;

  const { user, tokens } = await adminAuthService.login(email, password);

  return ApiResponse.ok(res, 'Login successful', {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * @desc    Admin logout
 * @route   POST /api/v1/admin/auth/logout
 * @access  Private (Admin)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await adminAuthService.logout(refreshToken);
  }

  return ApiResponse.ok(res, 'Logout successful');
});

/**
 * @desc    Refresh admin tokens
 * @route   POST /api/v1/admin/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as AdminRefreshTokenInput;

  const tokens = await adminAuthService.refreshTokens(refreshToken);

  return ApiResponse.ok(res, 'Token refreshed successfully', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });
});

/**
 * @desc    Get current admin profile
 * @route   GET /api/v1/admin/auth/me
 * @access  Private (Admin)
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = req.admin!;

  return ApiResponse.ok(res, 'Admin profile retrieved', {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    lastLoginAt: admin.lastLoginAt,
  });
});
