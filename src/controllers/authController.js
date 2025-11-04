import { createToken, verifyToken } from '../utils/authUtils.js';
import { comparePassword } from '../utils/passwordUtils.js';
import * as UserModel from '../models/usersModel.js';

export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.getUserByUsername(req.db, username);
    if (!user) {
      return res.status(404).json({ error: 'Credenciales inválidas' });
    }
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.rol,
    };

    const token = createToken(tokenPayload);

    res.json({
      message: `Bienvenido, ${user.name}`,
      token,
    });
  } catch (error) {
    next(error);
  }
};
