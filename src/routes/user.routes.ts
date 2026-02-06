import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { updateUserSchema } from '../validators/user.validator.js';

const router = Router();

// All routes are protected
router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateUserSchema), userController.updateMe);
router.post('/me/profile-image', uploadSingleImage('profileImage'), userController.uploadProfileImage);
router.delete('/me/profile-image', userController.removeProfileImage);
router.delete('/me', userController.deactivateAccount);

export default router;
