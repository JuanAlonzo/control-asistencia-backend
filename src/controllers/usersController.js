import { hashPassword } from '../utils/passwordUtils.js';
import * as UserModel from '../models/usersModel.js';

/**
 * Listar todos los usuarios
 */
// GET /api/usuarios
export const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAllUsers(req.db);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario específico
 */
// GET /api/usuarios/:id
export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await UserModel.getUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo usuario
 */
// POST /api/usuarios
export const createUser = async (req, res, next) => {
  const {
    name,
    username,
    password,
    email,
    phone,
    dni,
    position,
    rol = 'employee',
  } = req.body;

  // Validations
  if (!name || !username || !password)
    return res.status(400).json({
      error: 'Name, username, y password son campos requeridos',
    });

  if (username.length < 3) {
    return res.status(400).json({
      error: 'El nombre de usuario debe tener al menos 3 caracteres',
    });
  }

  // Validar formato de username (solo letras, números y guiones)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error:
        'El username solo puede contener letras, números, guiones y guiones bajos',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 6 caracteres',
    });
  }

  if (!['admin', 'employee'].includes(rol)) {
    return res.status(400).json({
      error: 'El rol debe ser "admin" o "employee"',
    });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const result = await UserModel.createUser(req.db, {
      name,
      username,
      password: hashedPassword,
      email,
      phone,
      dni,
      position,
      rol,
    });

    res.status(201).json({
      message: 'Usuario creado correctamente',
      userId: result.lastID,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    next(error);
  }
};

/**
 * Actualizar usuario
 */
// PUT /api/usuarios/:id
export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, username, password, email, phone, dni, position, rol, active } =
    req.body;

  try {
    // Verify user exists
    const user = await UserModel.getUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData = {
      name,
      username,
      email,
      phone,
      dni,
      position,
      rol,
      active,
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 6 caracteres',
        });
      }
      updateData.password = await hashPassword(password);
    }

    await UserModel.updateUser(req.db, id, updateData);

    res.json({
      message: 'Usuario actualizado correctamente',
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    next(error);
  }
};

/**
 * Eliminar usuario (soft delete)
 */
// DELETE /api/usuarios/:id
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserModel.getUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await UserModel.softDeleteUser(req.db, id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar usuarios eliminados (solo admin)
 */
// GET /api/usuarios/inactivos
export const getInactiveUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findInactiveUsers(req.db);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivar usuario eliminado (solo admin)
 */
// POST /api/usuarios/:id/reactivar
export const reactivateUserController = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.active) {
      return res.status(400).json({ error: 'El usuario ya está activo' });
    }
    await UserModel.reactivateUser(req.db, id);
    res.json({ message: 'Usuario reactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Estadísticas de usuarios (DASHBOARD)
 */
// GET /api/usuarios/stats
export const getUserStats = async (req, res) => {
  // Falta implementar
};
