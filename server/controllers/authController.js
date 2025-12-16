import Persona from '../models/Persona.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * @desc    Autenticar usuario y obtener token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validar que se proporcionen username y password
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporciona usuario y contraseña'
      });
    }

    // Buscar usuario e incluir password
    const persona = await Persona.findOne({ username: username.toLowerCase() }).select('+password');

    if (!persona) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar si el usuario está activo
    if (!persona.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Verificar contraseña
    const isMatch = await persona.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Actualizar último acceso
    persona.ultimoAcceso = new Date();
    await persona.save();

    // Generar token
    const token = generateToken(persona._id);

    // Respuesta sin password
    const personaData = {
      id: persona._id,
      username: persona.username,
      nombre: persona.nombre,
      email: persona.email,
      role: persona.role,
      permissions: persona.getPermissions(),
      ultimoAcceso: persona.ultimoAcceso
    };

    res.status(200).json({
      success: true,
      token,
      data: personaData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const persona = await Persona.findById(req.user._id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const personaData = {
      id: persona._id,
      username: persona.username,
      nombre: persona.nombre,
      email: persona.email,
      role: persona.role,
      permissions: persona.getPermissions(),
      ultimoAcceso: persona.ultimoAcceso,
      fechaCreacion: persona.fechaCreacion
    };

    res.status(200).json({
      success: true,
      data: personaData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cambiar contraseña
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporciona la contraseña actual y la nueva contraseña'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener usuario con password
    const persona = await Persona.findById(req.user._id).select('+password');

    // Verificar contraseña actual
    const isMatch = await persona.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    persona.password = newPassword;
    await persona.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

