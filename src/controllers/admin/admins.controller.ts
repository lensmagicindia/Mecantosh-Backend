import { Request, Response } from 'express';
import { adminsService } from '../../services/admin/admins.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AdminRole } from '../../interfaces/admin.interface.js';

/**
 * @desc    Get all admins with filters and pagination
 * @route   GET /api/v1/admin/admins
 * @access  Private (Super Admin)
 */
export const getAdmins = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const role = req.query.role as AdminRole | undefined;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

  const result = await adminsService.getAdmins({
    page,
    limit,
    search,
    role,
    isActive,
    sortBy,
    sortOrder,
  });

  return ApiResponse.ok(res, 'Admins retrieved', result);
});

/**
 * @desc    Get admin by ID
 * @route   GET /api/v1/admin/admins/:id
 * @access  Private (Super Admin)
 */
export const getAdminById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const admin = await adminsService.getAdminById(id);

  return ApiResponse.ok(res, 'Admin retrieved', admin);
});

/**
 * @desc    Create new admin
 * @route   POST /api/v1/admin/admins
 * @access  Private (Super Admin)
 */
export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, permissions, isActive } = req.body;

  const admin = await adminsService.createAdmin({
    email,
    password,
    name,
    role,
    permissions,
    isActive,
  });

  return ApiResponse.created(res, 'Admin created successfully', admin);
});

/**
 * @desc    Update admin
 * @route   PATCH /api/v1/admin/admins/:id
 * @access  Private (Super Admin)
 */
export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, password, name, role, permissions, isActive } = req.body;
  const requesterId = req.adminId!;

  const admin = await adminsService.updateAdmin(
    id,
    { email, password, name, role, permissions, isActive },
    requesterId
  );

  return ApiResponse.ok(res, 'Admin updated successfully', admin);
});

/**
 * @desc    Delete admin
 * @route   DELETE /api/v1/admin/admins/:id
 * @access  Private (Super Admin)
 */
export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.adminId!;

  await adminsService.deleteAdmin(id, requesterId);

  return ApiResponse.ok(res, 'Admin deleted successfully');
});

/**
 * @desc    Toggle admin active status
 * @route   PATCH /api/v1/admin/admins/:id/toggle-status
 * @access  Private (Super Admin)
 */
export const toggleAdminStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.adminId!;

  const admin = await adminsService.toggleAdminStatus(id, requesterId);

  return ApiResponse.ok(res, `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`, admin);
});

/**
 * @desc    Get available permissions
 * @route   GET /api/v1/admin/admins/permissions
 * @access  Private (Super Admin)
 */
export const getPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = adminsService.getAvailablePermissions();

  return ApiResponse.ok(res, 'Permissions retrieved', permissions);
});
