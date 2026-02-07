import { RequestHandler } from 'express';
import { bookingService } from '../services/booking.service.js';
import { slotService } from '../services/slot.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  CreateBookingInput,
  UpdateBookingInput,
  CancelBookingInput,
  GetBookingsQuery,
  CheckAvailabilityQuery,
} from '../validators/booking.validator.js';

/**
 * @desc    Get user bookings
 * @route   GET /api/v1/bookings
 * @access  Private
 */
export const getBookings: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as GetBookingsQuery;

  const result = await bookingService.getUserBookings(req.userId!, {
    status: query.status,
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
  });

  return ApiResponse.ok(res, 'Bookings retrieved', result.bookings, result.pagination);
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private
 */
export const getBooking: RequestHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.userId!);

  return ApiResponse.ok(res, 'Booking retrieved', booking);
});

/**
 * @desc    Create new booking
 * @route   POST /api/v1/bookings
 * @access  Private
 */
export const createBooking: RequestHandler = asyncHandler(async (req, res) => {
  const data = req.body as CreateBookingInput;

  const booking = await bookingService.createBooking(req.userId!, data);

  return ApiResponse.created(res, 'Booking created successfully', booking);
});

/**
 * @desc    Update booking (reschedule)
 * @route   PATCH /api/v1/bookings/:id
 * @access  Private
 */
export const updateBooking: RequestHandler = asyncHandler(async (req, res) => {
  const data = req.body as UpdateBookingInput;

  const booking = await bookingService.updateBooking(req.params.id, req.userId!, data);

  return ApiResponse.ok(res, 'Booking updated successfully', booking);
});

/**
 * @desc    Cancel booking
 * @route   POST /api/v1/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking: RequestHandler = asyncHandler(async (req, res) => {
  const { reason } = req.body as CancelBookingInput;

  const booking = await bookingService.cancelBooking(req.params.id, req.userId!, reason);

  return ApiResponse.ok(res, 'Booking cancelled successfully', booking);
});

/**
 * @desc    Get slot availability
 * @route   GET /api/v1/bookings/slots/availability
 * @access  Private
 */
export const checkAvailability: RequestHandler = asyncHandler(async (req, res) => {
  const { date, serviceId } = req.query as unknown as CheckAvailabilityQuery;

  const availability = await slotService.getAvailableSlots(date, serviceId);

  return ApiResponse.ok(res, 'Availability retrieved', availability);
});
