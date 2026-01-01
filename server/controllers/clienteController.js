import Cliente from '../models/Cliente.js';
import Credito from '../models/Credito.js';
import { registrarBorrado } from './historialBorradoController.js';

/**
 * @desc    Obtener todos los clientes
 * @route   GET /api/clientes
 * @access  Private
 */
export const getClientes = async (req, res, next) => {
  try {
    const { search, cartera, page = 1, limit = 50, archivados, supervision } = req.query;

    const query = {};
    const condiciones = [];

    // Filtro de archivados (SIEMPRE debe aplicarse)
    if (archivados === 'true') {
      condiciones.push({ esArchivado: true });
    } else {
      // No archivados: esArchivado debe ser false, null o no existir
      condiciones.push({
        $or: [
          { esArchivado: false },
          { esArchivado: null },
          { esArchivado: { $exists: false } }
        ]
      });
    }

    // Filtro de supervisión
    if (supervision === 'true') {
      condiciones.push({ enSupervision: true });
    } else if (supervision === 'false') {
      condiciones.push({
        $or: [
          { enSupervision: false },
          { enSupervision: null },
          { enSupervision: { $exists: false } }
        ]
      });
    }

    // Solo aplicar filtro de cartera para domiciliarios y supervisores con ciudad
    // Administradores y CEO ven todas las carteras (y supervisores sin ciudad si existieran)
    if (req.user && (req.user.role === 'domiciliario' || req.user.role === 'supervisor')) {
      if (req.user.ciudad === 'Guadalajara de Buga') {
        // Solo ven K3
        condiciones.push({ cartera: 'K3' });
      } else if (req.user.ciudad === 'Tuluá') {
        // Solo ven K1 y K2 (excluir K3)
        condiciones.push({
          $or: [
            { cartera: 'K1' },
            { cartera: 'K2' },
            { cartera: { $exists: false } } // Para clientes sin cartera definida (default K1)
          ]
        });
      }
    } else {
      // Para administradores y CEO, aplicar filtro de cartera solo si se especifica en query
      // Si no se especifica, verán todas las carteras
      if (cartera) {
        condiciones.push({ cartera: cartera });
      }
    }

    // Filtro de búsqueda
    if (search) {
      condiciones.push({
        $or: [
          { nombre: { $regex: search, $options: 'i' } },
          { documento: { $regex: search, $options: 'i' } },
          { telefono: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Construir query final: si hay múltiples condiciones, usar $and
    if (condiciones.length === 1) {
      Object.assign(query, condiciones[0]);
    } else if (condiciones.length > 1) {
      query.$and = condiciones;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const clientes = await Cliente.find(query)
      .populate('creditos')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit))


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
    // Asegurar que esArchivado esté definido (por defecto false)
    const clienteData = {
      ...req.body,
      esArchivado: req.body.esArchivado !== undefined ? req.body.esArchivado : false
    };
    const cliente = await Cliente.create(clienteData);

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

    // Liberar la posición del cliente (se libera automáticamente al eliminar)

    // Eliminar todos los créditos asociados
    await Credito.deleteMany({ cliente: req.params.id });

    // Eliminar el cliente
    await Cliente.findByIdAndDelete(req.params.id);

    // Registrar en historial
    await registrarBorrado({
      tipo: 'cliente',
      idOriginal: req.params.id,
      detalles: cliente, // Snapshot completo del cliente antes de borrar
      usuario: req.user._id,
      usuarioNombre: req.user.nombre,
      metadata: {
        nombreItem: cliente.nombre,
        documento: cliente.documento
      }
    });

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

/**
 * @desc    Archivar un cliente (liberar posición pero mantener información)
 * @route   PUT /api/clientes/:id/archivar
 * @access  Private
 */
export const archivarCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Verificar si el cliente ya está archivado
    if (cliente.esArchivado) {
      return res.status(400).json({
        success: false,
        error: 'El cliente ya está archivado'
      });
    }

    // Liberar la posición del cliente (permitir archivar incluso con créditos pendientes)
    cliente.posicion = null;
    cliente.esArchivado = true;

    await cliente.save();

    res.status(200).json({
      success: true,
      message: 'Cliente archivado correctamente',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Desarchivar un cliente (asignar nueva posición)
 * @route   PUT /api/clientes/:id/desarchivar
 * @access  Private
 */
// Helper: Determinar el tipo de pago del cliente basándose en créditos activos
const obtenerTipoPagoCliente = (cliente) => {
  if (!cliente || !cliente.creditos || cliente.creditos.length === 0) {
    return cliente?.tipoPagoEsperado || null;
  }

  // Buscar créditos activos o en mora (con cuotas no pagadas)
  const creditoActivo = cliente.creditos.find(c => {
    if (!c.cuotas || c.cuotas.length === 0) return false;
    const tieneCuotasPendientes = c.cuotas.some(cuota => !cuota.pagado);
    return tieneCuotasPendientes && c.tipo;
  });

  // Si hay crédito activo, usar su tipo de pago
  if (creditoActivo && creditoActivo.tipo) {
    return creditoActivo.tipo;
  }

  // Si no hay créditos activos, usar tipoPagoEsperado como fallback
  return cliente.tipoPagoEsperado || null;
};

export const desarchivarCliente = async (req, res, next) => {
  try {
    const { posicion } = req.body; // Posición específica enviada desde el frontend
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    if (!cliente.esArchivado) {
      return res.status(400).json({
        success: false,
        error: 'El cliente no está archivado'
      });
    }

    const cartera = cliente.cartera || 'K1';
    // Determinar el tipo de pago basándose en créditos activos (no solo tipoPagoEsperado)
    const tipoPagoCliente = obtenerTipoPagoCliente(cliente);

    // Si se proporciona una posición específica, validarla
    if (posicion !== undefined && posicion !== null) {
      const posicionNum = parseInt(posicion);

      // Validar que la posición sea un número válido
      if (isNaN(posicionNum)) {
        return res.status(400).json({
          success: false,
          error: 'La posición debe ser un número válido'
        });
      }

      // Construir query para verificar si la posición está ocupada
      // Primero buscar cualquier cliente en esa posición (sin considerar tipo de pago)
      const queryBase = {
        cartera,
        posicion: posicionNum,
        esArchivado: { $ne: true },
        _id: { $ne: req.params.id }
      };

      let clienteOcupando = await Cliente.findOne(queryBase);

      // Para K1 y K3, si hay un cliente ocupando la posición, verificar si es del mismo tipo de pago
      // Si es del mismo tipo, la posición está ocupada. Si es de otro tipo, está disponible.
      if ((cartera === 'K1' || cartera === 'K3') && tipoPagoCliente && clienteOcupando) {
        // Determinar el tipo de pago del cliente ocupante basándose en sus créditos activos
        const tipoPagoOcupante = obtenerTipoPagoCliente(clienteOcupando);

        // Si el ocupante es del mismo tipo de pago, la posición está ocupada
        if (tipoPagoOcupante === tipoPagoCliente) {
          // La posición está ocupada por un cliente del mismo tipo
        } else {
          // La posición está ocupada pero por un cliente de diferente tipo, está disponible
          clienteOcupando = null;
        }
      }

      if (clienteOcupando) {
        return res.status(400).json({
          success: false,
          error: `La posición ${posicion} ya está ocupada por otro cliente`
        });
      }

      // Validar rango de posición según cartera
      const capacidadMaxima = (cartera === 'K1' || cartera === 'K3') ? 150 : 225;
      if (posicionNum < 1 || posicionNum > capacidadMaxima) {
        return res.status(400).json({
          success: false,
          error: `La posición debe estar entre 1 y ${capacidadMaxima} para la cartera ${cartera}`
        });
      }

      cliente.posicion = posicionNum;
    } else {
      // Si no se proporciona posición, asignar automáticamente la primera disponible
      // Obtener todos los clientes de la cartera y filtrar en memoria por tipo de pago
      const todosLosClientes = await Cliente.find({
        cartera,
        esArchivado: { $ne: true }
      });

      // Filtrar clientes que tienen el mismo tipo de pago (basándose en créditos activos)
      const clientesMismoTipo = todosLosClientes.filter(c => {
        if (cartera === 'K2') {
          return true; // Para K2, todos los clientes cuentan
        }

        if ((cartera === 'K1' || cartera === 'K3') && tipoPagoCliente) {
          const tipoPagoOtroCliente = obtenerTipoPagoCliente(c);
          return tipoPagoOtroCliente === tipoPagoCliente;
        }

        return false;
      });

      const posicionesOcupadas = clientesMismoTipo
        .map(c => c.posicion)
        .filter(Boolean);

      const capacidadMaxima = (cartera === 'K1' || cartera === 'K3') ? 150 : 225;
      let nuevaPosicion = 1;
      while (posicionesOcupadas.includes(nuevaPosicion) && nuevaPosicion <= capacidadMaxima) {
        nuevaPosicion++;
      }

      if (nuevaPosicion > capacidadMaxima) {
        return res.status(400).json({
          success: false,
          error: 'No hay posiciones disponibles en esta cartera'
        });
      }

      cliente.posicion = nuevaPosicion;
    }

    cliente.esArchivado = false;

    await cliente.save();

    res.status(200).json({
      success: true,
      message: 'Cliente desarchivado correctamente',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener posiciones disponibles para una cartera y tipo de pago
 * @route   GET /api/clientes/posiciones-disponibles/:cartera
 * @access  Private
 */
export const getPosicionesDisponibles = async (req, res, next) => {
  try {
    const { cartera } = req.params;
    const { tipoPago } = req.query; // Tipo de pago: 'semanal', 'quincenal', 'mensual', 'diario' o null para K2

    let capacidadMaxima;

    if (cartera === 'K1') {
      capacidadMaxima = 150;
    } else if (cartera === 'K2') {
      capacidadMaxima = 225;
    } else if (cartera === 'K3') {
      capacidadMaxima = 150; // K3 se comporta como K1, con 150 espacios por tipo de pago
    } else {
      return res.status(400).json({
        success: false,
        error: 'Cartera inválida'
      });
    }

    // Obtener TODOS los clientes de la cartera (no archivados y con posición)
    const todosLosClientes = await Cliente.find({
      cartera,
      esArchivado: { $ne: true },
      posicion: { $ne: null }
    });

    // Filtrar en memoria según el tipo de pago (similar a la lógica del frontend)
    const clientesOcupando = todosLosClientes.filter(cliente => {
      // Para K2, todos los clientes cuentan
      if (cartera === 'K2') {
        return true;
      }

      // Para K1 y K3, filtrar por tipo de pago
      if ((cartera === 'K1' || cartera === 'K3') && tipoPago && (tipoPago === 'semanal' || tipoPago === 'quincenal')) {
        // Obtener tipos de pago activos del cliente
        const tiposActivos = new Set();
        if (cliente.creditos && cliente.creditos.length > 0) {
          cliente.creditos.forEach(credito => {
            // Verificar si el crédito tiene cuotas no pagadas (activo o en mora)
            const tieneCuotasPendientes = credito.cuotas && credito.cuotas.some(cuota => !cuota.pagado);
            if (tieneCuotasPendientes && credito.tipo) {
              tiposActivos.add(credito.tipo);
            }
          });
        }

        // Si tiene créditos activos, usar esos tipos
        // Si no tiene créditos pero tiene tipoPagoEsperado, usar ese
        const tiposDelCliente = tiposActivos.size > 0
          ? Array.from(tiposActivos)
          : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);

        // Verificar si el cliente tiene el tipo de pago solicitado
        return tiposDelCliente.includes(tipoPago);
      }

      // Si no hay tipoPago especificado para K1 o K3, no incluir (no debería pasar)
      return false;
    });

    const posicionesOcupadas = new Set(
      clientesOcupando.map(c => c.posicion).filter(Boolean)
    );

    // Generar lista de posiciones disponibles
    const posicionesDisponibles = [];
    for (let i = 1; i <= capacidadMaxima; i++) {
      if (!posicionesOcupadas.has(i)) {
        posicionesDisponibles.push(i);
      }
    }

    res.status(200).json({
      success: true,
      data: posicionesDisponibles
    });
  } catch (error) {
    next(error);
  }
};

