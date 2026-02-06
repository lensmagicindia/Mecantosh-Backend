import { Request, Response } from 'express';
import { vehicleService } from '../services/vehicle.service.js';
import { s3Service } from '../services/s3.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CreateVehicleInput, UpdateVehicleInput } from '../validators/vehicle.validator.js';
import { isUsingS3 } from '../middleware/upload.middleware.js';

/**
 * @desc    Get all user vehicles
 * @route   GET /api/v1/vehicles
 * @access  Private
 */
export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  const result = await vehicleService.getUserVehicles(req.userId!);

  return ApiResponse.ok(res, 'Vehicles retrieved', result);
});

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/v1/vehicles/:id
 * @access  Private
 */
export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id, req.userId!);

  return ApiResponse.ok(res, 'Vehicle retrieved', vehicle);
});

/**
 * @desc    Create new vehicle
 * @route   POST /api/v1/vehicles
 * @access  Private
 */
export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateVehicleInput;

  const vehicle = await vehicleService.createVehicle(req.userId!, data);

  return ApiResponse.created(res, 'Vehicle added successfully', vehicle);
});

/**
 * @desc    Update vehicle
 * @route   PATCH /api/v1/vehicles/:id
 * @access  Private
 */
export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateVehicleInput;

  const vehicle = await vehicleService.updateVehicle(req.params.id, req.userId!, data);

  return ApiResponse.ok(res, 'Vehicle updated successfully', vehicle);
});

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/v1/vehicles/:id
 * @access  Private
 */
export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  await vehicleService.deleteVehicle(req.params.id, req.userId!);

  return ApiResponse.ok(res, 'Vehicle deleted successfully');
});

/**
 * @desc    Upload vehicle image
 * @route   POST /api/v1/vehicles/:id/image
 * @access  Private
 */
export const uploadVehicleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return ApiResponse.error(res, 400, 'No image file provided');
  }

  let imagePath: string;

  if (isUsingS3()) {
    // Upload to S3
    imagePath = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'vehicles'
    );
  } else {
    // Use local path
    imagePath = req.file.path;
  }

  const vehicle = await vehicleService.uploadImage(req.params.id, req.userId!, imagePath);

  return ApiResponse.ok(res, 'Vehicle image uploaded successfully', {
    image: vehicle.image,
  });
});

/**
 * @desc    Set vehicle as default
 * @route   PATCH /api/v1/vehicles/:id/set-default
 * @access  Private
 */
export const setDefaultVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.setDefault(req.params.id, req.userId!);

  return ApiResponse.ok(res, 'Vehicle set as default', vehicle);
});
