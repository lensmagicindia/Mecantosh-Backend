import { Request, Response } from 'express';
import { adminStatsService } from '../../services/admin/stats.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * @desc    Get dashboard stats
 * @route   GET /api/v1/admin/stats
 * @access  Private (Admin)
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminStatsService.getStats();
  return ApiResponse.ok(res, 'Dashboard stats retrieved', stats);
});

/**
 * @desc    Get bookings chart data
 * @route   GET /api/v1/admin/stats/bookings-chart
 * @access  Private (Admin)
 */
export const getBookingsChart = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as 'week' | 'month' | 'year') || 'week';
  const data = await adminStatsService.getBookingsChart(period);
  return ApiResponse.ok(res, 'Bookings chart data retrieved', data);
});

/**
 * @desc    Get revenue chart data
 * @route   GET /api/v1/admin/stats/revenue-chart
 * @access  Private (Admin)
 */
export const getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as 'week' | 'month' | 'year') || 'week';
  const data = await adminStatsService.getRevenueChart(period);
  return ApiResponse.ok(res, 'Revenue chart data retrieved', data);
});

/**
 * @desc    Get users chart data
 * @route   GET /api/v1/admin/stats/users-chart
 * @access  Private (Admin)
 */
export const getUsersChart = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as 'week' | 'month' | 'year') || 'week';
  const data = await adminStatsService.getUsersChart(period);
  return ApiResponse.ok(res, 'Users chart data retrieved', data);
});

/**
 * @desc    Get recent activity
 * @route   GET /api/v1/admin/stats/recent-activity
 * @access  Private (Admin)
 */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await adminStatsService.getRecentActivity(limit);
  return ApiResponse.ok(res, 'Recent activity retrieved', data);
});

export const adminStatsController = {
  getStats,
  getBookingsChart,
  getRevenueChart,
  getUsersChart,
  getRecentActivity,
};

export default adminStatsController;
