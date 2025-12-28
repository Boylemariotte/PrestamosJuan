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

    // Solo aplicar filtro de cartera para domiciliarios
    // Administradores y CEO ven todos los créditos (de todas las carteras)
    if (req.user && req.user.role === 'domiciliario') {
      if (req.user.ciudad === 'Guadalajara de Buga') {
        // Domiciliarios de Buga solo ven créditos de clientes K3
        const clientesIds = await Cliente.find({ cartera: 'K3' }).select('_id');
        query.cliente = { $in: clientesIds.map(c => c._id.toString()) };
      } else {
        // Domiciliarios de Tuluá (u otra ciudad) solo ven créditos de clientes K1 y K2
        const clientesIds = await Cliente.find({
          $or: [
            { cartera: 'K1' },
            { cartera: 'K2' },
            { cartera: { $exists: false } }
          ]
        }).select('_id');
        query.cliente = { $in: clientesIds.map(c => c._id.toString()) };
      }
    }
    // Si no es domiciliario (administrador o CEO), no se aplica filtro de cartera

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const creditos = await Credito.find(query)
      .populate('cliente', 'nombre documento telefono cartera')
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
      abonosMulta: creditoData.abonosMulta || [],
      multas: creditoData.multas || [],
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
      // Usar el totalAPagar ya calculado por recalcularCreditoCompleto (considera abonos parciales)
      // No recalcular aquí para evitar duplicaciones

      cliente.creditos[idx] = {
        id: creditoId,
        monto: credito.monto,
        papeleria: credito.papeleria,
        montoEntregado: credito.montoEntregado,
        tipo: credito.tipo,
        tipoQuincenal: credito.tipoQuincenal,
        fechaInicio: credito.fechaInicio,
        totalAPagar: credito.totalAPagar, // Usar el valor ya calculado por recalcularCreditoCompleto
        valorCuota: credito.valorCuota,
        numCuotas: credito.numCuotas,
        cuotas: credito.cuotas,
        abonos: credito.abonos,
        abonosMulta: credito.abonosMulta || [],
        multas: credito.multas,
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
    let credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({
        success: false,
        error: 'Crédito no encontrado'
      });
    }

    // Actualizar campos
    Object.assign(credito, req.body);

    // Recalcular totalAPagar si hay cambios en multas o cuotas
    credito = recalcularCreditoCompleto(credito);

    await credito.save();

    // Sincronizar con el embebido en cliente
    await syncCreditoToCliente(req.params.id);

    const creditoActualizado = await Credito.findById(credito._id).populate('cliente');

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
    // Ya no sumamos multas aquí, son independientes
    cuota.saldoPendiente = credito.valorCuota;
    cuota.abonoAplicado = 0;   // Campo virtual/auxiliar

    // Reset flags
    cuota.pagado = false;
    cuota.tieneAbono = false;

    // Limpiar abonosCuota embebidos
    cuota.abonosCuota = [];
  });

  // Resetear estado de multas y calcular saldo pendiente
  if (credito.multas) {
    credito.multas.forEach(m => {
      m.pagada = false;
      m.abonoAplicado = 0; // Campo auxiliar para calcular saldo
    });
  }

  // 2. Procesar Abonos de Multas (completamente independientes de abonos de cuotas)
  if (credito.abonosMulta && credito.abonosMulta.length > 0) {
    credito.abonosMulta.forEach(abonoMulta => {
      const multa = credito.multas ? credito.multas.find(m => m.id === abonoMulta.multaId) : null;
      if (multa) {
        // Acumular abonos a esta multa
        multa.abonoAplicado = (multa.abonoAplicado || 0) + abonoMulta.valor;
        // La multa está pagada solo si el abono aplicado >= valor de la multa
        multa.pagada = (multa.abonoAplicado || 0) >= multa.valor;
      }
    });
  }

  // 3. Ordenar abonos de cuotas cronológicamente para aplicación correcta
  const abonosOrdenados = [...(credito.abonos || [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // Mapa para rastrear la fecha del último abono que completó el pago de cada cuota
  const fechaPagoPorCuota = {};

  // 4. Procesar Abonos de Cuotas (solo abonos, no multas)
  for (const abono of abonosOrdenados) {
    let montoDisponible = abono.valor;
    let nroCuotaTarget = abono.nroCuota;

    // Intentar deducir cuota de la descripción si no está explícita (compatibilidad)
    if (!nroCuotaTarget && abono.descripcion) {
      const match = abono.descripcion.match(/(?:Cuota|cuota)\s*#(\d+)/);
      if (match) nroCuotaTarget = parseInt(match[1], 10);
    }

    if (nroCuotaTarget) {
      // A. Abono Específico a Cuota
      const cuota = credito.cuotas.find(c => c.nroCuota === nroCuotaTarget);
      if (cuota) {
        const saldoAntes = cuota.saldoPendiente;

        cuota.abonosCuota.push({
          id: abono.id,
          valor: montoDisponible,
          fecha: abono.fecha,
          fechaCreacion: abono.fechaCreacion || new Date()
        });

        cuota.abonoAplicado = (cuota.abonoAplicado || 0) + montoDisponible;
        cuota.saldoPendiente -= montoDisponible;

        // Si este abono completó el pago (saldo pendiente <= 10), guardar su fecha
        if (saldoAntes > 10 && cuota.saldoPendiente <= 10) {
          fechaPagoPorCuota[nroCuotaTarget] = abono.fecha;
        }
      }
    } else {
      // B. Abono General (Waterfall) 
      for (const cuota of credito.cuotas) {
        if (montoDisponible <= 0) break;
        if (cuota.saldoPendiente <= 0) continue;

        const saldoAntes = cuota.saldoPendiente;
        const aplicar = Math.min(montoDisponible, cuota.saldoPendiente);
        cuota.saldoPendiente -= aplicar;
        cuota.abonoAplicado = (cuota.abonoAplicado || 0) + aplicar;

        // Si este abono completó el pago (saldo pendiente <= 10), guardar su fecha
        if (saldoAntes > 10 && cuota.saldoPendiente <= 10) {
          fechaPagoPorCuota[cuota.nroCuota] = abono.fecha;
        }

        montoDisponible -= aplicar;
      }
    }
  }

  // 4. Finalizar Estados
  credito.cuotas.forEach(cuota => {
    if (cuota.saldoPendiente < 0) cuota.saldoPendiente = 0;
    cuota.pagado = cuota.saldoPendiente <= 10;
    cuota.tieneAbono = cuota.abonoAplicado > 0;

    if (cuota.pagado) {
      // Usar la fecha del abono que completó el pago, o la fecha más reciente de abonosCuota, o la fecha actual como fallback
      if (fechaPagoPorCuota[cuota.nroCuota]) {
        // Asegurar que la fecha se guarde correctamente sin problemas de zona horaria
        const fechaAbono = fechaPagoPorCuota[cuota.nroCuota];
        if (fechaAbono instanceof Date) {
          // Si ya es un Date, extraer la fecha (año, mes, día) y crear uno nuevo en UTC
          const year = fechaAbono.getUTCFullYear();
          const month = fechaAbono.getUTCMonth();
          const day = fechaAbono.getUTCDate();
          cuota.fechaPago = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
        } else if (typeof fechaAbono === 'string') {
          // Si es string, normalizar a Date en UTC mediodía para evitar problemas de zona horaria
          const partes = fechaAbono.split('T')[0].split('-');
          if (partes.length === 3) {
            cuota.fechaPago = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0, 0));
          } else {
            cuota.fechaPago = new Date(fechaAbono);
          }
        } else {
          cuota.fechaPago = new Date(fechaAbono);
        }
      } else if (cuota.abonosCuota && cuota.abonosCuota.length > 0) {
        // Si no hay fecha registrada, usar la fecha del último abono aplicado
        const ultimoAbono = cuota.abonosCuota[cuota.abonosCuota.length - 1];
        if (ultimoAbono.fecha) {
          if (ultimoAbono.fecha instanceof Date) {
            // Extraer la fecha (año, mes, día) y crear uno nuevo en UTC
            const year = ultimoAbono.fecha.getUTCFullYear();
            const month = ultimoAbono.fecha.getUTCMonth();
            const day = ultimoAbono.fecha.getUTCDate();
            cuota.fechaPago = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
          } else if (typeof ultimoAbono.fecha === 'string') {
            const partes = ultimoAbono.fecha.split('T')[0].split('-');
            if (partes.length === 3) {
              cuota.fechaPago = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0, 0));
            } else {
              cuota.fechaPago = new Date(ultimoAbono.fecha);
            }
          } else {
            cuota.fechaPago = new Date(ultimoAbono.fecha);
          }
        } else {
          cuota.fechaPago = new Date();
        }
      } else if (!cuota.fechaPago) {
        // Fallback: usar fecha actual solo si no hay fecha previa
        cuota.fechaPago = new Date();
      }
    } else {
      cuota.fechaPago = null;
    }
  });

  // 5. Recalcular totalAPagar: incluir saldo pendiente de multas (considerando abonos parciales)
  let totalMultasPendientes = 0;
  if (credito.multas) {
    credito.multas.forEach(multa => {
      const abonoAplicado = multa.abonoAplicado || 0;
      const saldoPendiente = multa.valor - abonoAplicado;
      if (saldoPendiente > 0) {
        totalMultasPendientes += saldoPendiente;
      }
    });
  }

  // totalAPagar = (valorCuota * numCuotas) + saldoPendienteMultas
  const totalCuotas = credito.valorCuota * credito.numCuotas;
  credito.totalAPagar = totalCuotas + totalMultasPendientes;

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
      // 2. Normalizar la fecha de pago para evitar problemas de zona horaria
      let fechaPagoNormalizada = new Date();
      if (fechaPago) {
        if (typeof fechaPago === 'string') {
          // Si viene como string YYYY-MM-DD, crear Date en UTC mediodía para evitar problemas de zona horaria
          const partes = fechaPago.split('T')[0].split('-');
          if (partes.length === 3) {
            // Usar UTC para que la fecha se mantenga correcta independientemente de la zona horaria del servidor
            fechaPagoNormalizada = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0, 0));
          } else {
            fechaPagoNormalizada = new Date(fechaPago);
          }
        } else if (fechaPago instanceof Date) {
          fechaPagoNormalizada = fechaPago;
        } else {
          fechaPagoNormalizada = new Date(fechaPago);
        }
      }

      // 3. Crear un abono por el valor exacto del saldo pendiente
      const nuevoAbono = {
        id: Date.now().toString(),
        valor: saldoPendiente,
        descripcion: `Pago total Cuota #${nroCuotaInt}`,
        fecha: fechaPagoNormalizada,
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
    const { valor, descripcion, fecha, tipo, nroCuota, multaId } = req.body;
    let credito = await Credito.findById(req.params.id);

    if (!credito) {
      return res.status(404).json({ success: false, error: 'Crédito no encontrado' });
    }

    // Si es un abono de multa, agregarlo a abonosMulta (completamente independiente)
    if (multaId || tipo === 'multa') {
      if (!multaId) {
        return res.status(400).json({ success: false, error: 'multaId es requerido para abonos de multa' });
      }

      // Normalizar la fecha del abono de multa para evitar problemas de zona horaria
      let fechaAbonoMulta = fecha || new Date();
      if (fecha) {
        if (typeof fecha === 'string') {
          // Si viene como string YYYY-MM-DD, crear Date en UTC mediodía para evitar problemas de zona horaria
          const partes = fecha.split('T')[0].split('-');
          if (partes.length === 3) {
            // Usar UTC para que la fecha se mantenga correcta independientemente de la zona horaria del servidor
            fechaAbonoMulta = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0, 0));
          } else {
            fechaAbonoMulta = new Date(fecha);
          }
        } else if (fecha instanceof Date) {
          fechaAbonoMulta = fecha;
        } else {
          fechaAbonoMulta = new Date(fecha);
        }
      }

      const nuevoAbonoMulta = {
        id: Date.now().toString(),
        valor: parseFloat(valor),
        descripcion: descripcion || 'Abono a multa',
        fecha: fechaAbonoMulta,
        multaId: multaId
      };

      credito.abonosMulta = credito.abonosMulta || [];
      credito.abonosMulta.push(nuevoAbonoMulta);
    } else {
      // Abono de cuota (normal)
      const nuevoAbono = {
        id: Date.now().toString(),
        valor: parseFloat(valor),
        descripcion: descripcion || 'Abono al crédito',
        fecha: fecha || new Date(),
        nroCuota: nroCuota ? parseInt(nroCuota, 10) : null
      };

      credito.abonos.push(nuevoAbono);
    }

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

    // Buscar en abonos de cuotas
    const abonoEncontrado = credito.abonos.find(a => a.id === abonoId);
    if (abonoEncontrado) {
      credito.abonos = credito.abonos.filter(a => a.id !== abonoId);
    } else {
      // Buscar en abonos de multas
      credito.abonosMulta = (credito.abonosMulta || []).filter(a => a.id !== abonoId);
    }

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

    // Buscar primero en abonos de cuotas
    let abonoIndex = credito.abonos.findIndex(a => a.id === abonoId);
    let esAbonoMulta = false;

    // Si no se encuentra, buscar en abonos de multas
    if (abonoIndex === -1) {
      abonoIndex = (credito.abonosMulta || []).findIndex(a => a.id === abonoId);
      esAbonoMulta = abonoIndex !== -1;
    }

    if (abonoIndex === -1) {
      return res.status(404).json({ success: false, error: 'Abono no encontrado' });
    }

    // Normalizar fecha si se proporciona
    let fechaNormalizada = null;
    if (fecha) {
      if (typeof fecha === 'string') {
        const partes = fecha.split('T')[0].split('-');
        if (partes.length === 3) {
          fechaNormalizada = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0, 0));
        } else {
          fechaNormalizada = new Date(fecha);
        }
      } else if (fecha instanceof Date) {
        fechaNormalizada = fecha;
      } else {
        fechaNormalizada = new Date(fecha);
      }
    }

    if (esAbonoMulta) {
      // Actualizar abono de multa
      const abonoOriginal = credito.abonosMulta[abonoIndex];

      // Crear una copia del objeto para asegurar que Mongoose detecte el cambio
      const abonoActualizado = {
        id: abonoOriginal.id || abonoId,
        valor: valor !== undefined ? parseFloat(valor) : abonoOriginal.valor,
        descripcion: descripcion !== undefined ? descripcion : abonoOriginal.descripcion,
        fecha: fechaNormalizada || abonoOriginal.fecha,
        multaId: abonoOriginal.multaId // Asegurar que multaId se mantenga
      };

      // Usar set para actualizar el array completo y forzar que Mongoose detecte el cambio
      const nuevosAbonosMulta = credito.abonosMulta.map((abono, idx) =>
        idx === abonoIndex ? abonoActualizado : abono
      );
      credito.set('abonosMulta', nuevosAbonosMulta);

      console.log(`[editarAbono] Abono de multa actualizado:`, {
        abonoId,
        fechaAnterior: abonoOriginal.fecha,
        fechaNueva: abonoActualizado.fecha,
        valorAnterior: abonoOriginal.valor,
        valorNuevo: abonoActualizado.valor,
        fechaNormalizadaRecibida: fecha,
        fechaNormalizadaProcesada: fechaNormalizada
      });
    } else {
      // Actualizar abono de cuota
      const abonoOriginal = credito.abonos[abonoIndex];
      credito.abonos[abonoIndex] = {
        ...abonoOriginal,
        id: abonoOriginal.id || abonoId, // Asegurar que el ID siempre esté presente
        valor: valor ? parseFloat(valor) : abonoOriginal.valor,
        descripcion: descripcion !== undefined ? descripcion : abonoOriginal.descripcion,
        fecha: fechaNormalizada || abonoOriginal.fecha,
        tipo: tipo || abonoOriginal.tipo,
        nroCuota: nroCuota ? parseInt(nroCuota, 10) : (nroCuota === null ? null : abonoOriginal.nroCuota)
      };
    }

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
    // nroCuota es opcional ahora, solo informativo o para referencia visual
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    credito.multas = credito.multas || [];
    credito.multas.push({
      id: Date.now().toString(),
      valor: parseFloat(valor),
      motivo: motivo + (nroCuota ? ` (Ref. Cuota #${nroCuota})` : ''),
      fecha: new Date(),
      pagada: false
    });

    // Recalcular saldos y totalAPagar (incluye multas pendientes)
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
 * @desc    Editar una multa
 * @route   PUT /api/creditos/:id/multas/:multaId
 * @access  Private
 */
export const editarMulta = async (req, res, next) => {
  try {
    const { multaId } = req.params;
    const { valor, fecha, motivo } = req.body;
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    const multa = credito.multas.find(m => m.id === multaId);
    if (!multa) return res.status(404).json({ success: false, error: 'Multa no encontrada' });

    // Actualizar valores si se proporcionan
    if (valor !== undefined) {
      multa.valor = parseFloat(valor);
    }
    if (fecha !== undefined) {
      multa.fecha = new Date(fecha);
    }
    if (motivo !== undefined) {
      // Preservar la referencia a cuota si existe
      const match = multa.motivo.match(/\(Ref\. Cuota #(\d+)\)/);
      const nroCuotaRef = match ? match[1] : null;
      multa.motivo = motivo + (nroCuotaRef ? ` (Ref. Cuota #${nroCuotaRef})` : '');
    }

    // Recalcular saldos y totalAPagar
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
 * @desc    Eliminar una multa
 * @route   DELETE /api/creditos/:id/multas/:multaId
 * @access  Private
 */
export const eliminarMulta = async (req, res, next) => {
  try {
    const { multaId } = req.params;
    let credito = await Credito.findById(req.params.id);
    if (!credito) return res.status(404).json({ success: false, error: 'Crédito no encontrado' });

    // Eliminar la multa
    credito.multas = credito.multas.filter(m => m.id !== multaId);

    // Eliminar también todos los abonosMulta asociados a esta multa
    credito.abonosMulta = (credito.abonosMulta || []).filter(a => a.multaId !== multaId);

    // Recalcular saldos y totalAPagar (sin la multa eliminada y sus abonos)
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

