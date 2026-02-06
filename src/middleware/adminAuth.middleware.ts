import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import AdminUser from '../models/AdminUser.model.js';
import { IAdminUser } from '../interfaces/admin.interface.js';
import { config } from '../config/index.js';
import { Permission } from '../constants/permissions.js';

// Extend Express Request type for admin
declare global {
  namespace Express {
    interface Request {
      admin?: IAdminUser;
      adminId?: string;
    }
  }
}

interface AdminJWTPayload {
  adminId: string;
  type: string;
  iat: number;
  exp: number;
}

export const authenticateAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.accessSecret) as AdminJWTPayload;

    // Verify this is an admin token
    if (decoded.type !== 'admin') {
      throw ApiError.unauthorized('Invalid admin token');
    }

    const admin = await AdminUser.findById(decoded.adminId).select('-__v');

    if (!admin) {
      throw ApiError.unauthorized('Admin not found');
    }

    if (!admin.isActive) {
      throw ApiError.unauthorized('Admin account has been deactivated');
    }

    req.admin = admin;
    req.adminId = admin._id.toString();

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Access token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid access token'));
    } else {
      next(error);
    }
  }
};

export const requireSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.admin) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.admin.role !== 'super_admin') {
    return next(ApiError.forbidden('Super admin access required'));
  }

  next();
};

/**
 * Middleware factory to check if admin has required permission(s)
 * Super admins bypass all permission checks
 * @param permissions - One or more permissions required (OR logic - any permission grants access)
 */
export const requirePermission = (...permissions: Permission[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.admin) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super admins bypass all permission checks
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has any of the required permissions
    const hasPermission = permissions.some((permission) =>
      req.admin!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        ApiError.forbidden(
          `Access denied. Required permission: ${permissions.join(' or ')}`
        )
      );
    }

    next();
  };
};
