import Credito from '../models/Credito.js';
import Cliente from '../models/Cliente.js';

/**
 * @desc    Obtener todos los créditos
 * @route   GET /api/creditos
 * @access  Private
 */
export const getCreditos = async (req, res, next) => {
  try {
    const { cliente, tipo, estado, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (cliente) {
      query.cliente = cliente;
    }
    
    if (tipo) {
      query.tipo = tipo;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const creditos = await Credito.find(query)
      .populate('cliente', 'nombre documento telefono')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Credito.countDocuments(query);

    res.status(200).json({
      success: true,
      count: creditos.length,
      total,
      data: creditos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un crédito por ID
 * @route   GET /api/creditos/:id
 * @access  Private
 */
export const getCredito = async (req, res, next) => {
  try {
    const credito = await Credito.findById(req.params.id)
      .populate('cliente');

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: credito
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo crédito
 * @route   POST /api/creditos
 * @access  Private
 */
export const createCredito = async (req, res, next) => {
  try {
    const { clienteId, ...creditoData } = req.body;

    // Verificar que el cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const credito = await Credito.create({
      ...creditoData,
      cliente: clienteId
    });

    // Agregar el crédito al cliente
    cliente.creditos.push(credito._id);
    await cliente.save();

    const creditoPopulado = await Credito.findById(credito._id)
      .populate('cliente');

    res.status(201).json({
      success: true,
      data: creditoPopulado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un crédito
 * @route   PUT /api/creditos/:id
 * @access  Private
 */
export const updateCredito = async (req, res, next) => {
  try {
    const credito = await Credito.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('cliente');

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: credito
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un crédito
 * @route   DELETE /api/creditos/:id
 * @access  Private
 */
export const deleteCredito = async (req, res, next) => {
  try {
    const credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    // Remover el crédito del cliente
    await Cliente.findByIdAndUpdate(
      credito.cliente,
      { $pull: { creditos: credito._id } }
    );

    // Eliminar el crédito
    await Credito.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Crédito eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Registrar un pago
 * @route   PUT /api/creditos/:id/pagos
 * @access  Private
 */
export const registrarPago = async (req, res, next) => {
  try {
    const { nroCuota, fechaPago } = req.body;
    const credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    const cuota = credito.cuotas.find(c => c.nroCuota === nroCuota);
    if (!cuota) {
      return res.status(404).json({
        success: false,
        error: 'Cuota no encontrada'
      });
    }

    cuota.pagado = true;
    cuota.fechaPago = fechaPago || new Date();

    await credito.save();

    const creditoActualizado = await Credito.findById(credito._id)
      .populate('cliente');

    res.status(200).json({
      success: true,
      data: creditoActualizado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Agregar una nota a un crédito
 * @route   POST /api/creditos/:id/notas
 * @access  Private
 */
export const agregarNota = async (req, res, next) => {
  try {
    const { texto } = req.body;
    const credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    const nuevaNota = {
      id: Date.now().toString(),
      texto,
      fecha: new Date()
    };

    credito.notas.push(nuevaNota);
    await credito.save();

    const creditoActualizado = await Credito.findById(credito._id)
      .populate('cliente');

    res.status(201).json({
      success: true,
      data: creditoActualizado
    });
  } catch (error) {
    next(error);
  }
};

