import { Request, Response } from 'express';
import { serviceCatalogService } from '../services/service.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get all services
 * @route   GET /api/v1/services
 * @access  Public
 */
export const getServices = asyncHandler(async (_req: Request, res: Response) => {
  const services = await serviceCatalogService.getAllServices();

  return ApiResponse.ok(res, 'Services retrieved', { services });
});

/**
 * @desc    Get service by ID
 * @route   GET /api/v1/services/:id
 * @access  Public
 */
export const getService = asyncHandler(async (req: Request, res: Response) => {
  const service = await serviceCatalogService.getServiceById(req.params.id);

  return ApiResponse.ok(res, 'Service retrieved', service);
});
