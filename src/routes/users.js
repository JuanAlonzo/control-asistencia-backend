import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getInactiveUsers,
  reactivateUserController,
  updateMyProfile,
  getMyProfile,
} from '../controllers/usersController.js';
import {
  createUserSchema,
  updateUserSchema,
  updateMyProfileSchema,
} from '../schemas/user.schema.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de Admin
router.get('/', protect, isAdmin, getUsers);

// Rutas especificas (ANTES DE LAS dinamicas)
router.get('/inactive', protect, isAdmin, getInactiveUsers);
router.get('/me', protect, getMyProfile);
router.put(
  '/me/profile',
  protect,
  validateSchema(updateMyProfileSchema),
  updateMyProfile
);
router.post('/:id/reactivate', protect, isAdmin, reactivateUserController);

// Rutas CRUD de Admin
router.get('/:id', protect, isAdmin, getUserById);
router.post(
  '/',
  protect,
  isAdmin,
  validateSchema(createUserSchema),
  createUser
);
router.put(
  '/:id',
  protect,
  isAdmin,
  validateSchema(updateUserSchema),
  updateUser
);
router.delete('/:id', protect, isAdmin, deleteUser);

export default router;
