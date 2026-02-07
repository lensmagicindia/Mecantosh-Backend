import { Router } from 'express';
import {
  createUnavailability,
  listUnavailability,
  getUnavailabilityByDate,
  getUnavailabilityById,
  updateUnavailability,
  deleteUnavailability,
  getDatesWithUnavailability,
} from '../../controllers/admin/unavailability.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createUnavailabilitySchema,
  updateUnavailabilitySchema,
  unavailabilityDateParamSchema,
  unavailabilityIdParamSchema,
  unavailabilityListQuerySchema,
  unavailabilityDatesQuerySchema,
} from '../../validators/admin.validator.js';

const router: Router = Router();

// All routes require admin authentication and staff permission
router.use(authenticateAdmin);
router.use(requirePermission('staff'));

// POST /admin/unavailability - Create new unavailability
router.post('/', validate(createUnavailabilitySchema), createUnavailability);

// GET /admin/unavailability - List all unavailability (with optional date range)
router.get('/', validate(unavailabilityListQuerySchema), listUnavailability);

// GET /admin/unavailability/dates - Get dates with unavailability in range
router.get('/dates', validate(unavailabilityDatesQuerySchema), getDatesWithUnavailability);

// GET /admin/unavailability/date/:date - Get unavailability for specific date
router.get('/date/:date', validate(unavailabilityDateParamSchema), getUnavailabilityByDate);

// GET /admin/unavailability/:id - Get specific unavailability by ID
router.get('/:id', validate(unavailabilityIdParamSchema), getUnavailabilityById);

// PATCH /admin/unavailability/:id - Update unavailability
router.patch('/:id', validate(updateUnavailabilitySchema), updateUnavailability);

// DELETE /admin/unavailability/:id - Delete unavailability
router.delete('/:id', validate(unavailabilityIdParamSchema), deleteUnavailability);

export default router;
