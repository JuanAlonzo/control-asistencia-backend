import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashear una contraseña
 * @param {string} password - La contraseña en texto plano
 * @return {Promise<string>} - La contraseña hasheada
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Comparar una contraseña con su hash
 * @param {string} password - La contraseña en texto plano
 * @param {string} hashedPassword - La contraseña hasheada
 * @return {Promise<boolean>} - True si coinciden, false si no
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
