import { Request, Response } from 'express';
import { unavailabilityService } from '../../services/admin/unavailability.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const createUnavailability = asyncHandler(async (req: Request, res: Response) => {
  const unavailability = await unavailabilityService.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Unavailability created successfully',
    data: unavailability,
  });
});

export const listUnavailability = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const unavailabilities = await unavailabilityService.list(
    startDate as string | undefined,
    endDate as string | undefined
  );
  res.json({
    success: true,
    message: 'Unavailability list retrieved successfully',
    data: unavailabilities,
  });
});

export const getUnavailabilityByDate = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.params;
  const unavailabilities = await unavailabilityService.getByDate(date);
  res.json({
    success: true,
    message: 'Unavailability for date retrieved successfully',
    data: unavailabilities,
  });
});

export const getUnavailabilityById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const unavailability = await unavailabilityService.getById(id);
  res.json({
    success: true,
    message: 'Unavailability retrieved successfully',
    data: unavailability,
  });
});

export const updateUnavailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const unavailability = await unavailabilityService.update(id, req.body);
  res.json({
    success: true,
    message: 'Unavailability updated successfully',
    data: unavailability,
  });
});

export const deleteUnavailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await unavailabilityService.delete(id);
  res.json({
    success: true,
    message: 'Unavailability deleted successfully',
  });
});

export const getDatesWithUnavailability = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw ApiError.badRequest('startDate and endDate are required');
  }
  const dates = await unavailabilityService.getDatesWithUnavailability(
    startDate as string,
    endDate as string
  );
  res.json({
    success: true,
    message: 'Dates with unavailability retrieved successfully',
    data: dates,
  });
});
