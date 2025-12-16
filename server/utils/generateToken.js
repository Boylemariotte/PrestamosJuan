import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT para un usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Token JWT
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token válido por 30 días
  });
};

