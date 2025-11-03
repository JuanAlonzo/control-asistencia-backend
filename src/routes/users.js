import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getInactiveUsers,
  reactivateUserController,
} from '../controllers/usersController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Solo los administradores pueden gestionar usuarios
router.get('/', protect, isAdmin, getUsers);

// Rutas para usuarios inactivos
router.get('/inactive', protect, isAdmin, getInactiveUsers);
router.post('/:id/reactivate', protect, isAdmin, reactivateUserController);

// Rutas CRUD para usuarios
router.get('/:id', protect, isAdmin, getUserById);
router.post('/', protect, isAdmin, createUser);
router.put('/:id', protect, isAdmin, updateUser);
router.delete('/:id', protect, isAdmin, deleteUser);

export default router;
