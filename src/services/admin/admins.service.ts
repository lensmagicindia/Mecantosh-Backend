import AdminUser from '../../models/AdminUser.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { IAdminUserResponse, AdminRole } from '../../interfaces/admin.interface.js';
import { Permission, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from '../../constants/permissions.js';

interface AdminFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedAdmins {
  items: IAdminUserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateAdminData {
  email: string;
  password: string;
  name: string;
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

interface UpdateAdminData {
  email?: string;
  password?: string;
  name?: string;
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

interface PermissionInfo {
  value: Permission;
  label: string;
  description: string;
}

class AdminsService {
  /**
   * Get all admins with filters and pagination
   */
  async getAdmins(params: AdminFilters): Promise<PaginatedAdmins> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // Search filter (name, email)
    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Role filter
    if (params.role) {
      query.role = params.role;
    }

    // Active filter
    if (params.isActive !== undefined) {
      query.isActive = params.isActive;
    }

    // Sorting
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [admins, total] = await Promise.all([
      AdminUser.find(query).sort(sort).skip(skip).limit(limit),
      AdminUser.countDocuments(query),
    ]);

    const items: IAdminUserResponse[] = admins.map((admin) => ({
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string): Promise<IAdminUserResponse> {
    const admin = await AdminUser.findById(id);

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  /**
   * Create new admin
   */
  async createAdmin(data: CreateAdminData): Promise<IAdminUserResponse> {
    // Check email uniqueness
    const existingAdmin = await AdminUser.findOne({ email: data.email.toLowerCase() });
    if (existingAdmin) {
      throw ApiError.conflict('An admin with this email already exists');
    }

    // Super admins get all permissions automatically
    const permissions = data.role === 'super_admin' ? ALL_PERMISSIONS : (data.permissions || []);

    const admin = await AdminUser.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'admin',
      permissions,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  /**
   * Update admin
   */
  async updateAdmin(
    id: string,
    data: UpdateAdminData,
    requesterId: string
  ): Promise<IAdminUserResponse> {
    const admin = await AdminUser.findById(id);

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Prevent self-demotion from super_admin
    if (id === requesterId && admin.role === 'super_admin' && data.role === 'admin') {
      throw ApiError.badRequest('You cannot demote yourself from super admin');
    }

    // Prevent self-deactivation
    if (id === requesterId && data.isActive === false) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }

    // Check email uniqueness if changing email
    if (data.email && data.email.toLowerCase() !== admin.email) {
      const existingAdmin = await AdminUser.findOne({ email: data.email.toLowerCase() });
      if (existingAdmin) {
        throw ApiError.conflict('An admin with this email already exists');
      }
    }

    // Update fields
    if (data.email) admin.email = data.email;
    if (data.password) admin.password = data.password;
    if (data.name) admin.name = data.name;
    if (data.role) admin.role = data.role;
    if (data.isActive !== undefined) admin.isActive = data.isActive;

    // Handle permissions - super admins get all permissions
    if (data.role === 'super_admin') {
      admin.permissions = ALL_PERMISSIONS;
    } else if (data.permissions !== undefined) {
      admin.permissions = data.permissions;
    }

    await admin.save();

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  /**
   * Delete admin
   */
  async deleteAdmin(id: string, requesterId: string): Promise<void> {
    // Prevent self-deletion
    if (id === requesterId) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    const admin = await AdminUser.findById(id);

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    await AdminUser.findByIdAndDelete(id);
  }

  /**
   * Toggle admin active status
   */
  async toggleAdminStatus(id: string, requesterId: string): Promise<IAdminUserResponse> {
    // Prevent self-deactivation
    if (id === requesterId) {
      throw ApiError.badRequest('You cannot toggle your own account status');
    }

    const admin = await AdminUser.findById(id);

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  /**
   * Get available permissions for UI
   */
  getAvailablePermissions(): PermissionInfo[] {
    return ALL_PERMISSIONS.map((permission) => ({
      value: permission,
      label: PERMISSION_LABELS[permission],
      description: PERMISSION_DESCRIPTIONS[permission],
    }));
  }
}

export const adminsService = new AdminsService();
export default adminsService;
