import { RequestHandler } from 'express';
import { adminUsersService } from '../../services/admin/users.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * @desc    Get all users with filters and pagination
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin)
 */
export const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
  const isVerified = req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  const result = await adminUsersService.getUsers({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    isVerified,
    dateFrom,
    dateTo,
  });

  return ApiResponse.ok(res, 'Users retrieved', result);
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Admin)
 */
export const getUserById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await adminUsersService.getUserById(id);

  return ApiResponse.ok(res, 'User retrieved', user);
});

/**
 * @desc    Export users to CSV
 * @route   GET /api/v1/admin/users/export
 * @access  Private (Admin)
 */
export const exportUsers: RequestHandler = asyncHandler(async (req, res) => {
  const format = (req.query.format as 'csv' | 'excel') || 'csv';

  const csv = await adminUsersService.exportUsers(format);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);

  return res.send(csv);
});
