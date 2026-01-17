import mongoose from 'mongoose';
import MovimientoCaja from '../models/MovimientoCaja.js';
import Papeleria from '../models/Papeleria.js';
import { registrarBorrado } from './historialBorradoController.js';

/**
 * @desc    Obtener todos los movimientos de caja
 * @route   GET /api/movimientos-caja
 * @access  Private
 */
export const getMovimientosCaja = async (req, res, next) => {
  try {
    const { tipo, tipoMovimiento, fechaInicio, fechaFin, page = 1, limit = 100 } = req.query;

    const query = {};

    if (tipo) {
      query.tipo = tipo;
    }
    if (tipoMovimiento) {
      query.tipoMovimiento = tipoMovimiento;
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
    // Buscar por id o _id
    const movimiento = await MovimientoCaja.findOne({
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    });

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
    const movimientoData = { ...req.body };

    // Generar ID único si no viene en los datos
    if (!movimientoData.id && !movimientoData._id) {
      movimientoData.id = `MOV-${new mongoose.Types.ObjectId().toString()}`;
    } else if (movimientoData._id && !movimientoData.id) {
      movimientoData.id = movimientoData._id.toString();
    } else if (movimientoData.id && !movimientoData._id) {
      movimientoData._id = movimientoData.id;
    }

    // Normalizar valores numéricos y de fecha
    if (movimientoData.valor !== undefined) {
      movimientoData.valor = Number(movimientoData.valor);
    }
    if (movimientoData.papeleria !== undefined) {
      movimientoData.papeleria = Number(movimientoData.papeleria);
    }
    if (movimientoData.montoEntregado !== undefined) {
      movimientoData.montoEntregado = Number(movimientoData.montoEntregado);
    }
    if (movimientoData.caja !== undefined) {
      movimientoData.caja = Number(movimientoData.caja);
    }
    if (movimientoData.fecha) {
      const fecha = new Date(movimientoData.fecha);
      fecha.setHours(12, 0, 0, 0);
      movimientoData.fecha = fecha;
    }
    if (!movimientoData.tipoMovimiento) {
      movimientoData.tipoMovimiento = 'flujoCaja';
    }

    const movimiento = await MovimientoCaja.create(movimientoData);

    // Si es un préstamo y tiene valor de papelería, crear transacción de papelería automática
    if (movimiento.tipo === 'prestamo' && movimiento.papeleria && movimiento.papeleria > 0) {
      try {
        await Papeleria.create({
          tipo: 'ingreso',
          descripcion: `Papelería préstamo - ${movimiento.descripcion || 'Sin descripción'}`,
          cantidad: movimiento.papeleria,
          fecha: movimiento.fecha,
          movimientoId: movimiento._id, // Enlazar con el movimiento original
          caja: movimiento.caja,
          tipoMovimiento: 'ingreso',
          ciudadPapeleria: movimiento.caja === 3 ? 'Guadalajara de Buga' : 'Tuluá'
        });
      } catch (papeleriaError) {
        console.error('Error creando transacción de papelería automática:', papeleriaError);
        // No fallamos la request principal, pero logueamos el error
      }
    }

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
    // Buscar por id o _id
    const movimiento = await MovimientoCaja.findOneAndUpdate(
      {
        $or: [
          { _id: req.params.id },
          { id: req.params.id }
        ]
      },
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
    // Buscar por id o _id
    const movimiento = await MovimientoCaja.findOne({
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    });

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento de caja no encontrado'
      });
    }

    const movimientoEliminado = await MovimientoCaja.findOneAndDelete({
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    });

    // Eliminar transacción de papelería asociada si existe
    try {
      if (movimientoEliminado) {
        await Papeleria.findOneAndDelete({
          movimientoId: movimientoEliminado._id
        });

        // Registrar en historial
        await registrarBorrado({
          tipo: 'movimiento-caja',
          idOriginal: req.params.id,
          detalles: movimientoEliminado,
          usuario: req.user._id,
          usuarioNombre: req.user.nombre,
          metadata: {
            nombreItem: movimientoEliminado.descripcion || 'Sin descripción',
            valor: movimientoEliminado.valor,
            tipoCaja: movimientoEliminado.tipo,
            motivo: req.body.motivo || 'No especificado'
          }
        });
      }
    } catch (papeleriaError) {
      console.error('Error eliminando transacción de papelería automática:', papeleriaError);
    }

    res.status(200).json({
      success: true,
      message: 'Movimiento de caja eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};
