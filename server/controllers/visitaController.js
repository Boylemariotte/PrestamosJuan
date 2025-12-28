import Visita from '../models/Visita.js';

/**
 * @desc    Obtener todas las visitas
 * @route   GET /api/visitas
 * @access  Private
 */
export const getVisitas = async (req, res, next) => {
  try {
    const {
      completada,
      fechaInicio,
      fechaFin,
      search,
      page = 1,
      limit = 100
    } = req.query;

    const query = {};

    if (completada !== undefined) {
      query.completada = completada === 'true';
    }

    if (fechaInicio || fechaFin) {
      query.fechaVisita = {};
      if (fechaInicio) {
        query.fechaVisita.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        query.fechaVisita.$lte = new Date(fechaFin);
      }
    }

    if (search) {
      query.$or = [
        { 'solicitante.nombre': { $regex: search, $options: 'i' } },
        { 'solicitante.cc': { $regex: search, $options: 'i' } },
        { 'fiador.nombre': { $regex: search, $options: 'i' } },
        { 'fiador.cc': { $regex: search, $options: 'i' } },
        { numeroCliente: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const visitas = await Visita.find(query)
      .sort({ fechaVisita: 1, fechaAgendamiento: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Visita.countDocuments(query);

    res.status(200).json({
      success: true,
      count: visitas.length,
      total,
      data: visitas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una visita por ID
 * @route   GET /api/visitas/:id
 * @access  Private
 */
export const getVisita = async (req, res, next) => {
  try {
    const visita = await Visita.findById(req.params.id);

    if (!visita) {
      return res.status(404).json({
        success: false,
        error: 'Visita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: visita
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear una nueva visita
 * @route   POST /api/visitas
 * @access  Private
 */
export const createVisita = async (req, res, next) => {
  try {
    // Convertir fechas de string a Date si vienen como string
    const visitaData = { ...req.body };

    if (visitaData.fechaAgendamiento && typeof visitaData.fechaAgendamiento === 'string') {
      visitaData.fechaAgendamiento = new Date(visitaData.fechaAgendamiento);
    }

    if (visitaData.fechaVisita && typeof visitaData.fechaVisita === 'string') {
      visitaData.fechaVisita = new Date(visitaData.fechaVisita);
    }

    const visita = await Visita.create(visitaData);

    res.status(201).json({
      success: true,
      data: visita
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una visita
 * @route   PUT /api/visitas/:id
 * @access  Private
 */
export const updateVisita = async (req, res, next) => {
  try {
    const visitaData = { ...req.body };

    // Convertir fechas de string a Date si vienen como string
    if (visitaData.fechaAgendamiento && typeof visitaData.fechaAgendamiento === 'string') {
      visitaData.fechaAgendamiento = new Date(visitaData.fechaAgendamiento);
    }

    if (visitaData.fechaVisita && typeof visitaData.fechaVisita === 'string') {
      visitaData.fechaVisita = new Date(visitaData.fechaVisita);
    }

    const visita = await Visita.findByIdAndUpdate(
      req.params.id,
      visitaData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!visita) {
      return res.status(404).json({
        success: false,
        error: 'Visita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: visita
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una visita
 * @route   DELETE /api/visitas/:id
 * @access  Private
 */
export const deleteVisita = async (req, res, next) => {
  try {
    const visita = await Visita.findById(req.params.id);

    if (!visita) {
      return res.status(404).json({
        success: false,
        error: 'Visita no encontrada'
      });
    }

    await Visita.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Visita eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marcar visita como completada
 * @route   PUT /api/visitas/:id/completar
 * @access  Private
 */
export const completarVisita = async (req, res, next) => {
  try {
    const visita = await Visita.findByIdAndUpdate(
      req.params.id,
      { completada: true },
      { new: true }
    );

    if (!visita) {
      return res.status(404).json({
        success: false,
        error: 'Visita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: visita
    });
  } catch (error) {
    next(error);
  }
};

