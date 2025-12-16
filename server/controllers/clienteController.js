import Cliente from '../models/Cliente.js';
import Credito from '../models/Credito.js';

/**
 * @desc    Obtener todos los clientes
 * @route   GET /api/clientes
 * @access  Private
 */
export const getClientes = async (req, res, next) => {
  try {
    const { search, cartera, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (cartera) {
      query.cartera = cartera;
    }
    
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { documento: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const clientes = await Cliente.find(query)
      .populate('creditos')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cliente.countDocuments(query);

    res.status(200).json({
      success: true,
      count: clientes.length,
      total,
      data: clientes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un cliente por ID
 * @route   GET /api/clientes/:id
 * @access  Private
 */
export const getCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate({
        path: 'creditos',
        populate: {
          path: 'cliente',
          select: 'nombre documento'
        }
      });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo cliente
 * @route   POST /api/clientes
 * @access  Private
 */
export const createCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.create(req.body);

    res.status(201).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un cliente
 * @route   PUT /api/clientes/:id
 * @access  Private
 */
export const updateCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('creditos');

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un cliente
 * @route   DELETE /api/clientes/:id
 * @access  Private
 */
export const deleteCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Eliminar todos los créditos asociados
    await Credito.deleteMany({ cliente: req.params.id });

    // Eliminar el cliente
    await Cliente.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar coordenadas GPS de un cliente
 * @route   PUT /api/clientes/:id/coordenadas
 * @access  Private
 */
export const updateCoordenadas = async (req, res, next) => {
  try {
    const { tipo, coordenadas, entidad = 'cliente' } = req.body;
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    if (entidad === 'fiador') {
      if (!cliente.fiador) {
        cliente.fiador = {};
      }
      const campo = tipo === 'trabajo' ? 'coordenadasTrabajo' : 'coordenadasResidencia';
      const campoFecha = tipo === 'trabajo' ? 'coordenadasTrabajoActualizada' : 'coordenadasResidenciaActualizada';
      
      cliente.fiador[campo] = coordenadas;
      cliente.fiador[campoFecha] = new Date();
    } else {
      const campo = tipo === 'trabajo' ? 'coordenadasTrabajo' : 'coordenadasResidencia';
      const campoFecha = tipo === 'trabajo' ? 'coordenadasTrabajoActualizada' : 'coordenadasResidenciaActualizada';
      
      cliente[campo] = coordenadas;
      cliente[campoFecha] = new Date();
    }

    await cliente.save();

    res.status(200).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

