import { Request, Response } from 'express';
import { adminStaffService } from '../../services/admin/staff.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UpdateStaffConfigInput } from '../../validators/admin.validator.js';

/**
 * @desc    Get staff configuration
 * @route   GET /api/v1/admin/staff/config
 * @access  Private (Admin)
 */
export const getStaffConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await adminStaffService.getStaffConfig();

  return ApiResponse.ok(res, 'Staff configuration retrieved', config);
});

/**
 * @desc    Update staff configuration
 * @route   PATCH /api/v1/admin/staff/config
 * @access  Private (Admin)
 */
export const updateStaffConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateStaffConfigInput;

  const config = await adminStaffService.updateStaffConfig(data);

  return ApiResponse.ok(res, 'Staff configuration updated', config);
});

/**
 * @desc    Get daily availability
 * @route   GET /api/v1/admin/staff/availability/:date
 * @access  Private (Admin)
 */
export const getDailyAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.params;

  const availability = await adminStaffService.getDailyAvailability(date);

  return ApiResponse.ok(res, 'Daily availability retrieved', availability);
});

/**
 * @desc    Get bookings for a specific date
 * @route   GET /api/v1/admin/staff/bookings/:date
 * @access  Private (Admin)
 */
export const getBookingsForDate = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.params;

  const bookings = await adminStaffService.getBookingsForDate(date);

  return ApiResponse.ok(res, 'Bookings retrieved', bookings);
});
