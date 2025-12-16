import jwt from 'jsonwebtoken';
import Persona from '../models/Persona.js';

/**
 * Middleware para proteger rutas - verificar token JWT
 */
export const protect = async (req, res, next) => {
  let token;

  // Verificar si el token está en el header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado, token no proporcionado'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario del token (sin password)
    req.user = await Persona.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (!req.user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado, token inválido'
    });
  }
};

/**
 * Middleware para verificar permisos específicos
 */
export const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const hasPermission = permissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar rol mínimo
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const hasRole = roles.some(role => 
      req.user.canAccess(role) || req.user.role === role
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'No tienes el rol necesario para realizar esta acción'
      });
    }

    next();
  };
};

