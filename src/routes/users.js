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
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de Admin
router.get('/', protect, isAdmin, getUsers);

// Rutas especificas (ANTES DE LAS dinamicas)
router.get('/inactive', protect, isAdmin, getInactiveUsers);
router.get('/me', protect, getMyProfile);
router.put('/me/profile', protect, updateMyProfile);
router.post('/:id/reactivate', protect, isAdmin, reactivateUserController);

// Rutas CRUD de Admin
router.get('/:id', protect, isAdmin, getUserById);
router.post('/', protect, isAdmin, createUser);
router.put('/:id', protect, isAdmin, updateUser);
router.delete('/:id', protect, isAdmin, deleteUser);

export default router;
