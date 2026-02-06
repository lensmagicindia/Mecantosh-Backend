import { z } from 'zod';

const vehicleTypes = ['sedan', 'suv', 'hatchback', 'truck', 'van', 'other'] as const;

export const createVehicleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Vehicle name is required')
      .max(50, 'Vehicle name cannot exceed 50 characters')
      .trim(),
    licensePlate: z
      .string()
      .min(1, 'License plate is required')
      .max(20, 'License plate cannot exceed 20 characters')
      .trim(),
    make: z.string().max(50, 'Make cannot exceed 50 characters').trim().optional(),
    vehicleModel: z.string().max(50, 'Model cannot exceed 50 characters').trim().optional(),
    year: z
      .number()
      .min(1900, 'Year must be after 1900')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
      .optional(),
    color: z.string().max(30, 'Color cannot exceed 30 characters').trim().optional(),
    vehicleType: z.enum(vehicleTypes).default('sedan'),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Vehicle name is required')
      .max(50, 'Vehicle name cannot exceed 50 characters')
      .trim()
      .optional(),
    licensePlate: z
      .string()
      .min(1, 'License plate is required')
      .max(20, 'License plate cannot exceed 20 characters')
      .trim()
      .optional(),
    make: z.string().max(50, 'Make cannot exceed 50 characters').trim().optional(),
    vehicleModel: z.string().max(50, 'Model cannot exceed 50 characters').trim().optional(),
    year: z
      .number()
      .min(1900, 'Year must be after 1900')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
      .optional(),
    color: z.string().max(30, 'Color cannot exceed 30 characters').trim().optional(),
    vehicleType: z.enum(vehicleTypes).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Vehicle ID is required'),
  }),
});

export const vehicleIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle ID is required'),
  }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
