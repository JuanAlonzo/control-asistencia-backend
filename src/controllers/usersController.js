import { comparePassword, hashPassword } from '../utils/passwordUtils.js';
import * as UserModel from '../models/usersModel.js';

/**
 * Listar todos los usuarios
 */
// GET /api/usuarios
export const getUsers = async (req, res, next) => {
  const { limit, page } = req.query;
  try {
    const result = await UserModel.getAllUsers(req.db, { limit, page });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener mi perfil
 */
// GET /api/usuarios/me
export const getMyProfile = async (req, res, next) => {
  const { id } = req.user;
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
  const { name, username, password, email, phone, dni, position, rol } =
    req.body;

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
      updateData.password = await hashPassword(password);
    }

    const user = await UserModel.findUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await UserModel.updateUser(req.db, { id: id, ...updateData });

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
 * Actualizar mi perfil (como usuario logueado)
 */
// PUT /api/usuarios/:id
export const updateMyProfile = async (req, res, next) => {
  const { id } = req.user;
  const { currentPassword, name, email, phone, dni, position, newPassword } =
    req.body;

  try {
    const user = await UserModel.findUserById(req.db, id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const updateData = {
      name,
      email,
      phone,
      dni,
      position,
    };

    if (newPassword) {
      updateData.password = await hashPassword(newPassword);
    }

    const result = await UserModel.updateUser(req.db, {
      id: id,
      ...updateData,
    });

    if (result.changes > 0 || updateData.password) {
      res.json({ message: 'Perfil actualizado correctamente' });
    } else {
      res.json({
        message: 'No se proporcionaron datos nuevos para actualizar',
      });
    }
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
  const { limit, page } = req.query;

  try {
    const result = await UserModel.findInactiveUsers(req.db, { limit, page });
    res.json(result);
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
