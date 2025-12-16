import mongoose from 'mongoose';
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

    // Generar ID único para el crédito (más robusto que Date.now())
    const creditoId = creditoData.id || `CRED-${new mongoose.Types.ObjectId().toString()}`;

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
  try {
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
      console.log(`Sincronización exitosa para crédito ${creditoId} en cliente ${cliente._id}`);
    } else {
      console.warn(`No se encontró crédito ${creditoId} embebido en cliente ${cliente._id} para sincronizar.`);
    }
  } catch (error) {
    console.error(`Error sincronizando crédito ${creditoId}:`, error);
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
 * Función Helper: Recalcular saldos de todas las cuotas basándose en multas y abonos.
 * Implementa lógica "Waterfall" (Cascada) similar al frontend para consistencia en BD.
 */
const recalcularCreditoCompleto = (credito) => {
  // 1. Resetear el estado de todas las cuotas a valores iniciales
  credito.cuotas.forEach(cuota => {
    const totalMultas = cuota.multas ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) : 0;
    cuota.saldoPendiente = credito.valorCuota + totalMultas;
    cuota.multasCubiertas = 0; // Campo virtual/auxiliar útil si se persiste
    cuota.abonoAplicado = 0;   // Campo virtual/auxiliar

    // Si fue pagado manualmente (flag forzado), se respeta temporalmente, 
    // pero la lógica de abonos debería predominar si queremos consistencia total.
    // Asumiremos que 'pagado' es resultado del cálculo, salvo que queramos un override.
    // Para este requerimiento, recalcularemos 'pagado' basado en saldo <= 0.
    cuota.pagado = false;
    cuota.tieneAbono = false;

    // Limpiar abonosCuota embebidos para reconstruirlos (Single Source of Truth: credito.abonos)
    cuota.abonosCuota = [];
  });

  // 2. Ordenar abonos cronológicamente para aplicación correcta
  const abonosOrdenados = [...(credito.abonos || [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // 3. Procesar Abonos
  let saldoGeneral = 0;

  for (const abono of abonosOrdenados) {
    let montoDisponible = abono.valor;
    let nroCuotaTarget = abono.nroCuota;

    // Intentar deducir cuota de la descripción si no está explícita (compatibilidad)
    if (!nroCuotaTarget && abono.descripcion) {
      const match = abono.descripcion.match(/(?:Cuota|cuota)\s*#(\d+)/);
      if (match) nroCuotaTarget = parseInt(match[1], 10);
    }

    if (nroCuotaTarget) {
      // A. Abono Específico
      const cuota = credito.cuotas.find(c => c.nroCuota === nroCuotaTarget);
      if (cuota) {
        // Registrar referencia en la cuota
        cuota.abonosCuota.push({
          id: abono.id,
          valor: montoDisponible,
          fecha: abono.fecha,
          fechaCreacion: abono.fechaCreacion || new Date() // Fallback
        });

        // Aplicar al saldo - TODO NO se separan multas ni capital aqui
        cuota.abonoAplicado = (cuota.abonoAplicado || 0) + montoDisponible;
        cuota.saldoPendiente -= montoDisponible;
      }
    } else {
      // B. Abono General (Waterfall) 
      for (const cuota of credito.cuotas) {
        if (montoDisponible <= 0) break;
        if (cuota.saldoPendiente <= 0) continue;

        const aplicar = Math.min(montoDisponible, cuota.saldoPendiente);
        cuota.saldoPendiente -= aplicar;
        cuota.abonoAplicado = (cuota.abonoAplicado || 0) + aplicar;
        montoDisponible -= aplicar;
      }
    }
  }

  // 4. Finalizar Estados
  credito.cuotas.forEach(cuota => {
    // Asegurar no negativos
    if (cuota.saldoPendiente < 0) cuota.saldoPendiente = 0;

    // Determinar flags
    cuota.pagado = cuota.saldoPendiente <= 10; // Tolerancia pequeña
    cuota.tieneAbono = cuota.abonoAplicado > 0;

    // Fecha pago
    if (cuota.pagado && !cuota.fechaPago) {
      cuota.fechaPago = new Date();
    }
    if (!cuota.pagado) {
      cuota.fechaPago = null;
    }
  });

  return credito;
};

/**
 * @desc    Registrar un pago (Marca cuota como pagada totalmente mediante un abono automático del saldo restante)
 * @route   PUT /api/creditos/:id/pagos
 * @access  Private
 */
export const registrarPago = async (req, res, next) => {
  try {
    const { nroCuota, fechaPago } = req.body;
    const nroCuotaInt = parseInt(nroCuota, 10);
    let credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({ success: false, error: 'Crédito no encontrado' });
    }

    // 1. Encontrar la cuota para saber cuánto debe
    // Primero, hacemos un recálculo rápido para saber el saldo real actual antes de pagar
    credito = recalcularCreditoCompleto(credito);

    const cuota = credito.cuotas.find(c => c.nroCuota === nroCuotaInt);
    if (!cuota) {
      return res.status(404).json({ success: false, error: 'Cuota no encontrada' });
    }

    const saldoPendiente = cuota.saldoPendiente;

    if (saldoPendiente > 0) {
      // 2. Crear un abono por el valor exacto del saldo pendiente
      const nuevoAbono = {
        id: Date.now().toString(),
        valor: saldoPendiente,
        descripcion: `Pago total Cuota #${nroCuotaInt}`,
        fecha: fechaPago || new Date(),
        tipo: 'abono',
        nroCuota: nroCuotaInt
      };

      credito.abonos.push(nuevoAbono);

      // 3. Recalcular nuevamente para aplicar cambios y actualizar estados
      credito = recalcularCreditoCompleto(credito);

      await credito.save();
      await syncCreditoToCliente(req.params.id);
    }

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');

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
    let credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({ success: false, error: 'Crédito no encontrado' });
    }

    const nuevoAbono = {
      id: Date.now().toString(),
      valor: parseFloat(valor),
      descripcion,
      fecha: fecha || new Date(),
      tipo: tipo || 'abono',
      nroCuota: nroCuota ? parseInt(nroCuota, 10) : null
    };

    credito.abonos.push(nuevoAbono);

    // Lógica Centralizada de Recálculo
    credito = recalcularCreditoCompleto(credito);

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
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const abonoId = req.params.abonoId;
    credito.abonos = credito.abonos.filter(a => a.id !== abonoId);

    // Recalcular todo el estado del crédito tras eliminar abono
    credito = recalcularCreditoCompleto(credito);

    await credito.save();
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');
    res.status(200).json({ success: true, data: creditoActualizado });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Editar un abono
 * @route   PUT /api/creditos/:id/abonos/:abonoId
 * @access  Private
 */
export const editarAbono = async (req, res, next) => {
  try {
    const { valor, descripcion, fecha, tipo, nroCuota } = req.body;
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const abonoId = req.params.abonoId;
    const abonoIndex = credito.abonos.findIndex(a => a.id === abonoId);

    if (abonoIndex === -1) {
      return res.status(404).json({ success: false, error: 'Abono no encontrado' });
    }

    // Actualizar campos del abono
    credito.abonos[abonoIndex] = {
      ...credito.abonos[abonoIndex],
      valor: valor ? parseFloat(valor) : credito.abonos[abonoIndex].valor,
      descripcion: descripcion !== undefined ? descripcion : credito.abonos[abonoIndex].descripcion,
      fecha: fecha || credito.abonos[abonoIndex].fecha,
      tipo: tipo || credito.abonos[abonoIndex].tipo,
      nroCuota: nroCuota ? parseInt(nroCuota, 10) : (nroCuota === null ? null : credito.abonos[abonoIndex].nroCuota)
    };

    // Recalcular todo el estado del crédito tras editar abono
    credito = recalcularCreditoCompleto(credito);

    await credito.save();
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
    const nroCuotaInt = parseInt(nroCuota, 10);
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const cuota = credito.cuotas.find(c => c.nroCuota === nroCuotaInt);
    if (!cuota) return res.status(404).json({ success: false, error: 'Cuota no encontrada' });

    cuota.multas = cuota.multas || [];
    cuota.multas.push({
      id: Date.now().toString(),
      valor: parseFloat(valor),
      motivo,
      fecha: new Date()
    });

    // Recalcular saldos (la multa aumenta el saldo pendiente)
    credito = recalcularCreditoCompleto(credito);

    await credito.save();
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

