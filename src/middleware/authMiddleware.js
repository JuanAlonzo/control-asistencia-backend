import { verifyToken } from '../utils/authUtils.js';
import * as UserModel from '../models/usersModel.js';

/**
 * Middleware para proteger rutas que requieren autenticación
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del encabezado Authorization
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      // Obtener el usuario asociado al token, si no existe(usuario desactivado), rechazar
      req.user = await UserModel.getUserById(req.db, decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({ error: 'Usuario no encontrado(token inválido)' });
      }

      // Continuar al siguiente middleware o ruta
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'No autorizado, token fallido' });
    }
  }
  // Verificar si no se proporcionó token
  if (!token) {
    return res.status(401).json({ error: 'No autorizado, sin token' });
  }
};

/** Middleware para verificar si el usuario es administrador
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export const isAdmin = async (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    return res.status(403).json({
      error: 'Acceso denegado: se requieren privilegios de administrador',
    });
  }
};
