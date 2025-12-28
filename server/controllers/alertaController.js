import Alerta from '../models/Alerta.js';

/**
 * @desc    Obtener todas las alertas
 * @route   GET /api/alertas
 * @access  Private
 */
export const getAlertas = async (req, res, next) => {
  try {
    const { activa, notificada, cliente, page = 1, limit = 50 } = req.query;

    const query = {};

    if (activa !== undefined) {
      query.activa = activa === 'true';
    }

    if (notificada !== undefined) {
      query.notificada = notificada === 'true';
    }

    if (cliente) {
      query.cliente = cliente;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alertas = await Alerta.find(query)
      .populate('cliente', 'nombre documento')
      .populate('credito')
      .sort({ fechaVencimiento: 1, fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alerta.countDocuments(query);

    res.status(200).json({
      success: true,
      count: alertas.length,
      total,
      data: alertas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una alerta por ID
 * @route   GET /api/alertas/:id
 * @access  Private
 */
export const getAlerta = async (req, res, next) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate('cliente')
      .populate('credito');

    if (!alerta) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear una nueva alerta
 * @route   POST /api/alertas
 * @access  Private
 */
export const createAlerta = async (req, res, next) => {
  try {
    const alerta = await Alerta.create(req.body);

    const alertaPopulada = await Alerta.findById(alerta._id)
      .populate('cliente', 'nombre documento')
      .populate('credito');

    res.status(201).json({
      success: true,
      data: alertaPopulada
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una alerta
 * @route   PUT /api/alertas/:id
 * @access  Private
 */
export const updateAlerta = async (req, res, next) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('cliente', 'nombre documento')
      .populate('credito');

    if (!alerta) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una alerta
 * @route   DELETE /api/alertas/:id
 * @access  Private
 */
export const deleteAlerta = async (req, res, next) => {
  try {
    const alerta = await Alerta.findById(req.params.id);

    if (!alerta) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }

    await Alerta.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Alerta eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marcar alerta como notificada
 * @route   PUT /api/alertas/:id/notificar
 * @access  Private
 */
export const marcarComoNotificada = async (req, res, next) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { notificada: true },
      { new: true }
    )
      .populate('cliente', 'nombre documento')
      .populate('credito');

    if (!alerta) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: alerta
    });
  } catch (error) {
    next(error);
  }
};

