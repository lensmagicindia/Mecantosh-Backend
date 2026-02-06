import { Request, Response } from 'express';
import { adminBookingsService } from '../../services/admin/bookings.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UpdateBookingStatusInput } from '../../validators/admin.validator.js';

/**
 * @desc    Get all bookings with filters
 * @route   GET /api/v1/admin/bookings
 * @access  Private (Admin)
 */
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const date = req.query.date as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await adminBookingsService.getBookings({
    page,
    limit,
    status,
    date,
    search,
  });

  return ApiResponse.ok(res, 'Bookings retrieved', result);
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/v1/admin/bookings/:id
 * @access  Private (Admin)
 */
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await adminBookingsService.getBookingById(id);

  return ApiResponse.ok(res, 'Booking retrieved', booking);
});

/**
 * @desc    Update booking status
 * @route   PATCH /api/v1/admin/bookings/:id/status
 * @access  Private (Admin)
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body as UpdateBookingStatusInput;

  const booking = await adminBookingsService.updateBookingStatus(id, status, reason);

  return ApiResponse.ok(res, 'Booking status updated', booking);
});
