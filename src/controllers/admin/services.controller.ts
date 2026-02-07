import { RequestHandler } from 'express';
import { adminServicesService } from '../../services/admin/services.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  CreateServiceInput,
  UpdateServiceInput,
  ReorderServicesInput,
} from '../../validators/admin.validator.js';

/**
 * @desc    Get all services
 * @route   GET /api/v1/admin/services
 * @access  Private (Admin)
 */
export const getServices: RequestHandler = asyncHandler(async (_req, res) => {
  const services = await adminServicesService.getAllServices();

  return ApiResponse.ok(res, 'Services retrieved', { services });
});

/**
 * @desc    Get service by ID
 * @route   GET /api/v1/admin/services/:id
 * @access  Private (Admin)
 */
export const getServiceById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await adminServicesService.getServiceById(id);

  return ApiResponse.ok(res, 'Service retrieved', service);
});

/**
 * @desc    Create a new service
 * @route   POST /api/v1/admin/services
 * @access  Private (Admin)
 */
export const createService: RequestHandler = asyncHandler(async (req, res) => {
  const data = req.body as CreateServiceInput;

  const service = await adminServicesService.createService({
    name: data.name,
    description: data.description,
    shortDescription: data.shortDescription,
    price: data.price,
    duration: data.duration,
    durationMinutes: data.durationMinutes,
    category: data.category,
    features: data.features,
    isActive: data.isActive,
  });

  return ApiResponse.created(res, 'Service created successfully', service);
});

/**
 * @desc    Update a service
 * @route   PATCH /api/v1/admin/services/:id
 * @access  Private (Admin)
 */
export const updateService: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body as UpdateServiceInput;

  const service = await adminServicesService.updateService(id, data);

  return ApiResponse.ok(res, 'Service updated successfully', service);
});

/**
 * @desc    Delete a service
 * @route   DELETE /api/v1/admin/services/:id
 * @access  Private (Admin)
 */
export const deleteService: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await adminServicesService.deleteService(id);

  return ApiResponse.noContent(res);
});

/**
 * @desc    Reorder services
 * @route   POST /api/v1/admin/services/reorder
 * @access  Private (Admin)
 */
export const reorderServices: RequestHandler = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body as ReorderServicesInput;

  const services = await adminServicesService.reorderServices(orderedIds);

  return ApiResponse.ok(res, 'Services reordered successfully', { services });
});
