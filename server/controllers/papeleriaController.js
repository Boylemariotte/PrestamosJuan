import Papeleria from '../models/Papeleria.js';

/**
 * @desc    Obtener todas las transacciones de papelería
 * @route   GET /api/papeleria
 * @access  Private
 */
export const getPapeleria = async (req, res, next) => {
  try {
    const { tipo, fechaInicio, fechaFin, search } = req.query;
    
    const query = {};
    
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
      // Manejar fecha para evitar desfases (usar mediodía)
      fechaTransaccion = new Date(fecha);
      if (!req.body.horaEspecifica) {
        fechaTransaccion.setHours(12, 0, 0, 0);
      }
    }

    const nuevaTransaccion = await Papeleria.create({
      ...req.body,
      fecha: fechaTransaccion,
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

    if (fecha) {
        const fechaObj = new Date(fecha);
        fechaObj.setHours(12, 0, 0, 0);
        datosActualizar.fecha = fechaObj;
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

