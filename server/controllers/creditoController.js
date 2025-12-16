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

    // Generar ID único para el crédito
    const creditoId = creditoData.id || `CRED-${Date.now()}`;

    // Validar y preparar cuotas
    const cuotasProcesadas = creditoData.cuotas.map(c => ({
      ...c,
      saldoPendiente: c.saldoPendiente !== undefined ? c.saldoPendiente : creditoData.valorCuota,
      pagado: c.pagado || false
    }));

    // 1. Guardar en la colección Creditos
    const credito = await Credito.create({
      ...creditoData,
      _id: creditoId,
      cuotas: cuotasProcesadas,
      cliente: clienteId
    });

    // 2. Preparar objeto embebido para el cliente (sin referencia circular)
    const creditoEmbebido = {
      id: creditoId,
      monto: creditoData.monto,
      papeleria: creditoData.papeleria || 0,
      montoEntregado: creditoData.montoEntregado,
      tipo: creditoData.tipo,
      tipoQuincenal: creditoData.tipoQuincenal || null,
      fechaInicio: creditoData.fechaInicio,
      totalAPagar: creditoData.totalAPagar,
      valorCuota: creditoData.valorCuota,
      numCuotas: creditoData.numCuotas,
      cuotas: cuotasProcesadas,
      abonos: creditoData.abonos || [],
      descuentos: creditoData.descuentos || [],
      notas: creditoData.notas || [],
      etiqueta: creditoData.etiqueta || null,
      esRenovacion: creditoData.esRenovacion || false,
      creditoAnteriorId: creditoData.creditoAnteriorId || null,
      fechaCreacion: new Date()
    };

    // 3. Agregar el crédito embebido al cliente
    cliente.creditos.push(creditoEmbebido);
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
 * Helper: Sincroniza el crédito de la colección Creditos al embebido en Cliente
 */
const syncCreditoToCliente = async (creditoId) => {
  const credito = await Credito.findById(creditoId);
  if (!credito) return;

  const cliente = await Cliente.findById(credito.cliente);
  if (!cliente) return;

  // Buscar el crédito embebido por su id
  const idx = cliente.creditos.findIndex(c => c.id === creditoId || c.id === credito._id.toString());

  if (idx !== -1) {
    // Actualizar el crédito embebido
    cliente.creditos[idx] = {
      id: creditoId,
      monto: credito.monto,
      papeleria: credito.papeleria,
      montoEntregado: credito.montoEntregado,
      tipo: credito.tipo,
      tipoQuincenal: credito.tipoQuincenal,
      fechaInicio: credito.fechaInicio,
      totalAPagar: credito.totalAPagar,
      valorCuota: credito.valorCuota,
      numCuotas: credito.numCuotas,
      cuotas: credito.cuotas,
      abonos: credito.abonos,
      descuentos: credito.descuentos,
      notas: credito.notas,
      etiqueta: credito.etiqueta,
      fechaEtiqueta: credito.fechaEtiqueta,
      renovado: credito.renovado,
      fechaRenovacion: credito.fechaRenovacion,
      creditoRenovacionId: credito.creditoRenovacionId,
      esRenovacion: credito.esRenovacion,
      creditoAnteriorId: credito.creditoAnteriorId,
      fechaCreacion: credito.fechaCreacion
    };
    await cliente.save();
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

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

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

    // Remover el crédito embebido del cliente
    const cliente = await Cliente.findById(credito.cliente);
    if (cliente) {
      cliente.creditos = cliente.creditos.filter(c => c.id !== req.params.id && c.id !== credito._id.toString());
      await cliente.save();
    }

    // Eliminar el crédito de la colección
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
    cuota.saldoPendiente = 0;

    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

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

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

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

/**
 * @desc    Agregar un abono a un crédito
 * @route   POST /api/creditos/:id/abonos
 * @access  Private
 */
export const agregarAbono = async (req, res, next) => {
  try {
    const { valor, descripcion, fecha, tipo, nroCuota } = req.body;
    const credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({ success: false, error: 'Crédito no encontrado' });
    }

    const nuevoAbono = {
      id: Date.now().toString(),
      valor,
      descripcion,
      fecha: fecha || new Date(),
      tipo: tipo || 'abono',
      nroCuota
    };

    credito.abonos.push(nuevoAbono);

    // Si es un abono a una cuota específica, actualizar saldo de la cuota
    if (nroCuota) {
      const cuota = credito.cuotas.find(c => c.nroCuota === nroCuota);
      if (cuota) {
        cuota.abonosCuota = cuota.abonosCuota || [];
        cuota.abonosCuota.push({
          id: nuevoAbono.id,
          valor,
          fecha: nuevoAbono.fecha,
          fechaCreacion: new Date()
        });

        // Recalcular saldo pendiente de la cuota
        const abonosTotal = cuota.abonosCuota.reduce((sum, a) => sum + a.valor, 0);
        const saldoPendiente = credito.valorCuota - abonosTotal;

        cuota.saldoPendiente = saldoPendiente > 0 ? saldoPendiente : 0;
        cuota.tieneAbono = true;
        cuota.pagado = saldoPendiente <= 0;
        if (cuota.pagado && !cuota.fechaPago) {
          cuota.fechaPago = nuevoAbono.fecha;
        }
      }
    }

    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');

    res.status(201).json({ success: true, data: creditoActualizado });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un abono
 * @route   DELETE /api/creditos/:id/abonos/:abonoId
 * @access  Private
 */
export const eliminarAbono = async (req, res, next) => {
  try {
    const credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const abonoId = req.params.abonoId;
    const abono = credito.abonos.find(a => a.id === abonoId);

    // Si el abono estaba ligado a una cuota, revertir cambios
    if (abono && abono.nroCuota) {
      const cuota = credito.cuotas.find(c => c.nroCuota === abono.nroCuota);
      if (cuota && cuota.abonosCuota) {
        cuota.abonosCuota = cuota.abonosCuota.filter(a => a.id !== abonoId);

        const abonosTotal = cuota.abonosCuota.reduce((sum, a) => sum + a.valor, 0);
        const saldoPendiente = credito.valorCuota - abonosTotal;

        cuota.saldoPendiente = saldoPendiente;
        cuota.pagado = saldoPendiente <= 0;
        if (!cuota.pagado) cuota.fechaPago = null;
        cuota.tieneAbono = cuota.abonosCuota.length > 0;
      }
    }

    credito.abonos = credito.abonos.filter(a => a.id !== abonoId);
    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');
    res.status(200).json({ success: true, data: creditoActualizado });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Agregar una multa
 * @route   POST /api/creditos/:id/multas
 * @access  Private
 */
export const agregarMulta = async (req, res, next) => {
  try {
    const { nroCuota, valor, motivo } = req.body;
    const credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const cuota = credito.cuotas.find(c => c.nroCuota === nroCuota);
    if (!cuota) return res.status(404).json({ success: false, error: 'Cuota no encontrada' });

    cuota.multas = cuota.multas || [];
    cuota.multas.push({
      id: Date.now().toString(),
      valor,
      motivo,
      fecha: new Date()
    });

    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');
    res.status(201).json({ success: true, data: creditoActualizado });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Agregar un descuento
 * @route   POST /api/creditos/:id/descuentos
 * @access  Private
 */
export const agregarDescuento = async (req, res, next) => {
  try {
    const { valor, tipo, descripcion } = req.body;
    const credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    credito.descuentos.push({
      id: Date.now().toString(),
      valor,
      tipo,
      descripcion,
      fecha: new Date()
    });

    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');
    res.status(201).json({ success: true, data: creditoActualizado });
  } catch (error) {
    next(error);
  }
};

