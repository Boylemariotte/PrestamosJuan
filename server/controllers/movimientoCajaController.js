import MovimientoCaja from '../models/MovimientoCaja.js';

/**
 * @desc    Obtener todos los movimientos de caja
 * @route   GET /api/movimientos-caja
 * @access  Private
 */
export const getMovimientosCaja = async (req, res, next) => {
  try {
    const { tipo, fechaInicio, fechaFin, page = 1, limit = 100 } = req.query;
    
    const query = {};
    
    if (tipo) {
      query.tipo = tipo;
    }
    
    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) {
        query.fecha.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        query.fecha.$lte = new Date(fechaFin);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movimientos = await MovimientoCaja.find(query)
      .sort({ fecha: -1, fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MovimientoCaja.countDocuments(query);

    // Calcular totales
    const totales = await MovimientoCaja.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: '$valor' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: movimientos.length,
      total,
      totales,
      data: movimientos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un movimiento de caja por ID
 * @route   GET /api/movimientos-caja/:id
 * @access  Private
 */
export const getMovimientoCaja = async (req, res, next) => {
  try {
    const movimiento = await MovimientoCaja.findById(req.params.id);

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento de caja no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo movimiento de caja
 * @route   POST /api/movimientos-caja
 * @access  Private
 */
export const createMovimientoCaja = async (req, res, next) => {
  try {
    const movimiento = await MovimientoCaja.create(req.body);

    res.status(201).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un movimiento de caja
 * @route   PUT /api/movimientos-caja/:id
 * @access  Private
 */
export const updateMovimientoCaja = async (req, res, next) => {
  try {
    const movimiento = await MovimientoCaja.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento de caja no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un movimiento de caja
 * @route   DELETE /api/movimientos-caja/:id
 * @access  Private
 */
export const deleteMovimientoCaja = async (req, res, next) => {
  try {
    const movimiento = await MovimientoCaja.findById(req.params.id);

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento de caja no encontrado'
      });
    }

    await MovimientoCaja.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movimiento de caja eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

