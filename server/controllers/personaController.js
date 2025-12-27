import Persona from '../models/Persona.js';

/**
 * @desc    Obtener todas las personas
 * @route   GET /api/personas
 * @access  Private (solo CEO y Administrador)
 */
export const getPersonas = async (req, res, next) => {
  try {
    const { role, activo, page = 1, limit = 50 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (activo !== undefined) {
      query.activo = activo === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const personas = await Persona.find(query)
      .select('-password')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Persona.countDocuments(query);

    res.status(200).json({
      success: true,
      count: personas.length,
      total,
      data: personas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una persona por ID
 * @route   GET /api/personas/:id
 * @access  Private
 */
export const getPersona = async (req, res, next) => {
  try {
    const persona = await Persona.findById(req.params.id).select('-password');

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    const personaData = {
      ...persona.toObject(),
      permissions: persona.getPermissions()
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
 * @desc    Crear una nueva persona
 * @route   POST /api/personas
 * @access  Private (solo CEO y Administrador)
 */
export const createPersona = async (req, res, next) => {
  try {
    const { username, password, nombre, email, role, ciudad } = req.body;

    // Validaciones
    if (!username || !password || !nombre || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporciona todos los campos requeridos'
      });
    }

    // Validar ciudad si el rol es domiciliario
    if (role === 'domiciliario' && !ciudad) {
      return res.status(400).json({
        success: false,
        error: 'La ciudad es requerida para domiciliarios'
      });
    }

    if (role === 'domiciliario' && !['Tuluá', 'Guadalajara de Buga'].includes(ciudad)) {
      return res.status(400).json({
        success: false,
        error: 'La ciudad debe ser "Tuluá" o "Guadalajara de Buga"'
      });
    }

    // Verificar si el username ya existe
    const personaExistente = await Persona.findOne({ username: username.toLowerCase() });
    if (personaExistente) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Verificar si el email ya existe
    const emailExistente = await Persona.findOne({ email: email.toLowerCase() });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Validar rol
    if (!['domiciliario', 'administrador', 'ceo'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido'
      });
    }

    // Crear persona
    const personaDataToCreate = {
      username: username.toLowerCase(),
      password,
      nombre,
      email: email.toLowerCase(),
      role
    };

    // Solo agregar ciudad si el rol es domiciliario
    if (role === 'domiciliario') {
      personaDataToCreate.ciudad = ciudad;
    }

    const persona = await Persona.create(personaDataToCreate);

    const personaData = {
      id: persona._id,
      username: persona.username,
      nombre: persona.nombre,
      email: persona.email,
      role: persona.role,
      activo: persona.activo,
      fechaCreacion: persona.fechaCreacion,
      permissions: persona.getPermissions()
    };

    // Incluir ciudad solo si es domiciliario
    if (persona.role === 'domiciliario' && persona.ciudad) {
      personaData.ciudad = persona.ciudad;
    }

    res.status(201).json({
      success: true,
      data: personaData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una persona
 * @route   PUT /api/personas/:id
 * @access  Private
 */
export const updatePersona = async (req, res, next) => {
  try {
    const { nombre, email, role, activo, password, ciudad } = req.body;
    const personaId = req.params.id;

    // Verificar que la persona existe
    const persona = await Persona.findById(personaId);
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    // Solo CEO puede cambiar roles de otros usuarios
    if (role && req.user.role !== 'ceo' && req.user._id.toString() !== personaId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para cambiar el rol'
      });
    }

    // Solo CEO puede desactivar otros usuarios
    if (activo !== undefined && req.user.role !== 'ceo' && req.user._id.toString() !== personaId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para cambiar el estado del usuario'
      });
    }

    // Solo CEO puede cambiar la contraseña de otros usuarios sin saber la anterior
    if (password) {
      if (req.user.role !== 'ceo' && req.user._id.toString() !== personaId) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para cambiar la contraseña de este usuario'
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      persona.password = password;
    }

    // Verificar si el email ya existe (si se está actualizando)
    if (email && email.toLowerCase() !== persona.email) {
      const emailExistente = await Persona.findOne({ email: email.toLowerCase() });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          error: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Verificar si el username ya existe (si se está actualizando)
    const { username } = req.body;
    if (username && username.toLowerCase() !== persona.username) {
      // Solo el CEO puede cambiar el nombre de usuario
      if (req.user.role !== 'ceo') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para cambiar el nombre de usuario'
        });
      }

      const usernameExistente = await Persona.findOne({ username: username.toLowerCase() });
      if (usernameExistente) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de usuario ya está en uso'
        });
      }
      persona.username = username.toLowerCase();
    }

    // Validar ciudad si el rol es o será domiciliario
    const nuevoRole = role || persona.role;
    if (nuevoRole === 'domiciliario') {
      const nuevaCiudad = ciudad !== undefined ? ciudad : persona.ciudad;
      if (!nuevaCiudad) {
        return res.status(400).json({
          success: false,
          error: 'La ciudad es requerida para domiciliarios'
        });
      }
      if (!['Tuluá', 'Guadalajara de Buga'].includes(nuevaCiudad)) {
        return res.status(400).json({
          success: false,
          error: 'La ciudad debe ser "Tuluá" o "Guadalajara de Buga"'
        });
      }
    }

    // Actualizar campos
    if (nombre) persona.nombre = nombre;
    if (email) persona.email = email.toLowerCase();
    if (role && req.user.role === 'ceo') {
      persona.role = role;
      // Si cambia de domiciliario a otro rol, eliminar ciudad
      if (role !== 'domiciliario') {
        persona.ciudad = undefined;
      }
    }
    if (activo !== undefined && req.user.role === 'ceo') persona.activo = activo;
    
    // Actualizar ciudad solo si el rol es domiciliario
    if (nuevoRole === 'domiciliario' && ciudad !== undefined) {
      persona.ciudad = ciudad;
    }

    await persona.save();

    const personaData = {
      id: persona._id,
      username: persona.username,
      nombre: persona.nombre,
      email: persona.email,
      role: persona.role,
      activo: persona.activo,
      permissions: persona.getPermissions()
    };

    // Incluir ciudad solo si es domiciliario
    if (persona.role === 'domiciliario' && persona.ciudad) {
      personaData.ciudad = persona.ciudad;
    }

    res.status(200).json({
      success: true,
      data: personaData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una persona
 * @route   DELETE /api/personas/:id
 * @access  Private (solo CEO)
 */
export const deletePersona = async (req, res, next) => {
  try {
    const persona = await Persona.findById(req.params.id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    // No permitir eliminar a sí mismo
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propia cuenta'
      });
    }

    await Persona.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Persona eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener permisos de una persona
 * @route   GET /api/personas/:id/permissions
 * @access  Private
 */
export const getPermissions = async (req, res, next) => {
  try {
    const persona = await Persona.findById(req.params.id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role: persona.role,
        permissions: persona.getPermissions()
      }
    });
  } catch (error) {
    next(error);
  }
};

