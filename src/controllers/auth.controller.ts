import { RequestHandler } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  SendOTPInput,
  VerifyOTPInput,
  RegisterInput,
  RefreshTokenInput,
  FirebaseLoginInput,
} from '../validators/auth.validator.js';

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
export const sendOTP: RequestHandler = asyncHandler(async (req, res) => {
  const { phone, countryCode = '+91', purpose } = req.body as SendOTPInput;

  const result = await authService.sendOTP(phone, countryCode, purpose);

  return ApiResponse.ok(res, 'OTP sent successfully', {
    expiresIn: result.expiresIn,
    retryAfter: result.retryAfter,
  });
});

/**
 * @desc    Verify OTP and login
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOTP: RequestHandler = asyncHandler(async (req, res) => {
  const { phone, countryCode = '+91', otp, purpose } = req.body as VerifyOTPInput;

  if (purpose === 'login') {
    const { user, tokens } = await authService.verifyOTPAndLogin(phone, countryCode, otp);

    return ApiResponse.ok(res, 'Login successful', {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  }

  // For register purpose, just verify OTP (actual registration in register endpoint)
  return ApiResponse.ok(res, 'OTP verified successfully');
});

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register: RequestHandler = asyncHandler(async (req, res) => {
  const { phone, countryCode = '+91', otp, name, email } = req.body as RegisterInput;

  const { user, tokens } = await authService.register(
    phone,
    countryCode,
    otp,
    name,
    email || undefined
  );

  return ApiResponse.created(res, 'Registration successful', {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });
});

/**
 * @desc    Login or register using Firebase Phone Auth
 * @route   POST /api/v1/auth/firebase-login
 * @access  Public
 */
export const firebaseLogin: RequestHandler = asyncHandler(async (req, res) => {
  const { firebaseIdToken, name, email } = req.body as FirebaseLoginInput;

  const { user, tokens, isNewUser } = await authService.firebaseLogin(
    firebaseIdToken,
    name,
    email
  );

  return ApiResponse.ok(res, isNewUser ? 'Registration successful' : 'Login successful', {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    isNewUser,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as RefreshTokenInput;

  const tokens = await authService.refreshToken(refreshToken);

  return ApiResponse.ok(res, 'Token refreshed successfully', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  return ApiResponse.ok(res, 'Logout successful');
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
export const logoutAll: RequestHandler = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.userId!);

  return ApiResponse.ok(res, 'Logged out from all devices');
});
