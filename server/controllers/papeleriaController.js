import Papeleria from '../models/Papeleria.js';

/**
 * @desc    Obtener todas las transacciones de papelería
 * @route   GET /api/papeleria
 * @access  Private
 */
export const getPapeleria = async (req, res, next) => {
  try {
    const { tipo, fechaInicio, fechaFin, search, ciudadPapeleria } = req.query;
    
    const query = {};
    
    // Filtrar por ciudad según el usuario
    if (req.user && req.user.role === 'domiciliario') {
      // Domiciliarios solo ven la papelería de su ciudad
      if (req.user.ciudad === 'Guadalajara de Buga') {
        query.ciudadPapeleria = 'Guadalajara de Buga';
      } else {
        // Domiciliarios de Tuluá o sin ciudad definida ven Tuluá
        query.ciudadPapeleria = 'Tuluá';
      }
    } else if (ciudadPapeleria) {
      // Admins y CEO pueden filtrar por ciudad específica si lo solicitan
      query.ciudadPapeleria = ciudadPapeleria;
    }
    // Si no hay filtro de ciudad y es admin/CEO, se devuelven todas (sin filtro de ciudad)
    
    if (tipo && tipo !== 'all') {
      query.tipo = tipo;
    }
    
    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        query.fecha.$gte = inicio;
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        query.fecha.$lte = fin;
      }
    }

    if (search) {
      query.$or = [
        { descripcion: { $regex: search, $options: 'i' } },
        { prestamoId: { $regex: search, $options: 'i' } }
      ];
    }

    const transacciones = await Papeleria.find(query).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: transacciones.length,
      data: transacciones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear una nueva transacción de papelería
 * @route   POST /api/papeleria
 * @access  Private
 */
export const createPapeleria = async (req, res, next) => {
  try {
    const { fecha } = req.body;
    let fechaTransaccion = new Date();
    
    if (fecha) {
      // Manejar fecha para evitar desfases de zona horaria
      // Si fecha es un objeto Date, usar sus componentes
      // Si es string, parsear y crear en hora local
      if (fecha instanceof Date) {
        fechaTransaccion = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12, 0, 0, 0);
      } else if (typeof fecha === 'string') {
        // Si viene como string ISO, extraer componentes
        const fechaObj = new Date(fecha);
        if (!isNaN(fechaObj.getTime())) {
          fechaTransaccion = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate(), 12, 0, 0, 0);
        } else {
          // Si es formato "yyyy-MM-dd", parsear directamente
          const parts = fecha.split('T')[0].split('-');
          if (parts.length === 3) {
            fechaTransaccion = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0, 0);
          }
        }
      }
      
      // Asegurar que siempre sea mediodía (a menos que se especifique hora específica)
      if (!req.body.horaEspecifica) {
        fechaTransaccion.setHours(12, 0, 0, 0);
      }
    }

    // Determinar ciudadPapeleria según el usuario
    let ciudadPapeleria = req.body.ciudadPapeleria;
    if (!ciudadPapeleria && req.user) {
      if (req.user.role === 'domiciliario') {
        // Domiciliarios solo pueden crear en su ciudad
        ciudadPapeleria = req.user.ciudad === 'Guadalajara de Buga' 
          ? 'Guadalajara de Buga' 
          : 'Tuluá';
      } else {
        // Admins y CEO por defecto crean en Tuluá si no especifican
        ciudadPapeleria = 'Tuluá';
      }
    } else if (!ciudadPapeleria) {
      ciudadPapeleria = 'Tuluá'; // Por defecto
    }

    const nuevaTransaccion = await Papeleria.create({
      ...req.body,
      fecha: fechaTransaccion,
      ciudadPapeleria: ciudadPapeleria,
      registradoPor: req.user ? req.user.nombre : 'Sistema'
    });

    res.status(201).json({
      success: true,
      data: nuevaTransaccion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una transacción de papelería
 * @route   PUT /api/papeleria/:id
 * @access  Private
 */
export const updatePapeleria = async (req, res, next) => {
  try {
    let transaccion = await Papeleria.findById(req.params.id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        error: 'Transacción no encontrada'
      });
    }

    const { fecha } = req.body;
    let datosActualizar = { ...req.body };

    // Preservar la fecha original si no se envía una nueva fecha explícitamente
    // Solo actualizar la fecha si se envía explícitamente en el body
    if (fecha !== undefined && fecha !== null && fecha !== '') {
      let fechaObj;
      
      // Manejar fecha para evitar desfases de zona horaria
      if (fecha instanceof Date) {
        fechaObj = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12, 0, 0, 0);
      } else if (typeof fecha === 'string') {
        // Si viene como string ISO, extraer componentes
        const tempDate = new Date(fecha);
        if (!isNaN(tempDate.getTime())) {
          fechaObj = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 12, 0, 0, 0);
        } else {
          // Si es formato "yyyy-MM-dd", parsear directamente
          const parts = fecha.split('T')[0].split('-');
          if (parts.length === 3) {
            fechaObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0, 0);
          } else {
            fechaObj = new Date(fecha);
            fechaObj.setHours(12, 0, 0, 0);
          }
        }
      } else {
        fechaObj = new Date(fecha);
        fechaObj.setHours(12, 0, 0, 0);
      }
      
      datosActualizar.fecha = fechaObj;
    } else {
      // Si no se envía fecha, mantener la fecha original
      delete datosActualizar.fecha;
    }

    // Actualizar registradoPor con el nombre del usuario actual
    if (req.user && req.user.nombre) {
      datosActualizar.registradoPor = req.user.nombre;
    } else if (req.user && req.user.username) {
      datosActualizar.registradoPor = req.user.username;
    } else {
      datosActualizar.registradoPor = 'Sistema';
    }

    transaccion = await Papeleria.findByIdAndUpdate(req.params.id, datosActualizar, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: transaccion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una transacción de papelería
 * @route   DELETE /api/papeleria/:id
 * @access  Private
 */
export const deletePapeleria = async (req, res, next) => {
  try {
    const transaccion = await Papeleria.findById(req.params.id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        error: 'Transacción no encontrada'
      });
    }

    await Papeleria.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

