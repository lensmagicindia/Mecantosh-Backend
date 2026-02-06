import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdSchema,
} from '../validators/vehicle.validator.js';

const router = Router();

// All routes are protected
router.use(authenticate);

router.get('/', vehicleController.getVehicles);
router.post('/', validate(createVehicleSchema), vehicleController.createVehicle);
router.get('/:id', validate(vehicleIdSchema), vehicleController.getVehicle);
router.patch('/:id', validate(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', validate(vehicleIdSchema), vehicleController.deleteVehicle);
router.post('/:id/image', validate(vehicleIdSchema), uploadSingleImage('vehicleImage'), vehicleController.uploadVehicleImage);
router.patch('/:id/set-default', validate(vehicleIdSchema), vehicleController.setDefaultVehicle);

export default router;
