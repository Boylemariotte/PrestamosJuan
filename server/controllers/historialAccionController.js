import HistorialAccion from '../models/HistorialAccion.js';

const formatearValor = (v) => {
  if (v === undefined || v === null || v === '') return '(vacío)';
  if (typeof v === 'number') return `$${v.toLocaleString('es-CO')}`;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v);
};

/**
 * Compara solo los campos indicados entre `antes` y `despues` y arma una descripción legible
 * con los que realmente cambiaron. Evita snapshots ruidosos con campos irrelevantes (ej. cuotas).
 */
export const resumenDiferencias = (antes, despues, campos, etiquetas = {}) => {
  const cambios = [];
  const antesFiltrado = {};
  const despuesFiltrado = {};

  for (const campo of campos) {
    const valorAntes = antes ? antes[campo] : undefined;
    const valorDespues = despues ? despues[campo] : undefined;
    const a = valorAntes instanceof Date ? valorAntes.toISOString() : valorAntes;
    const d = valorDespues instanceof Date ? valorDespues.toISOString() : valorDespues;

    if (JSON.stringify(a ?? null) !== JSON.stringify(d ?? null)) {
      antesFiltrado[campo] = valorAntes ?? null;
      despuesFiltrado[campo] = valorDespues ?? null;
      const etiqueta = etiquetas[campo] || campo;
      cambios.push(`${etiqueta}: ${formatearValor(valorAntes)} → ${formatearValor(valorDespues)}`);
    }
  }

  return {
    huboCambios: cambios.length > 0,
    descripcion: cambios.join('; '),
    antes: antesFiltrado,
    despues: despuesFiltrado
  };
};

/**
 * Registra una acción en la bitácora general. Best-effort: nunca debe tumbar la operación
 * principal si falla (igual que registrarCambiosPago/syncCreditoToCliente).
 */
export const registrarAccion = async (datos) => {
  try {
    await HistorialAccion.create(datos);
  } catch (error) {
    console.error('No se pudo registrar la acción en el historial:', error.message);
  }
};

/**
 * @desc    Listar la bitácora general de acciones (crear/editar/activar/desactivar/renovar).
 * @route   GET /api/historial-acciones?accion=&entidad=&clienteId=&creditoId=&desde=&hasta=&page=&limit=
 * @access  Private (administrador, ceo)
 */
export const obtenerHistorialAcciones = async (req, res, next) => {
  try {
    const { accion, entidad, clienteId, creditoId, desde, hasta, page = 1, limit = 50 } = req.query;
    const query = {};

    if (accion) query.accion = accion;
    if (entidad) query.entidad = entidad;
    if (clienteId) query.clienteId = clienteId;
    if (creditoId) query.creditoId = creditoId;

    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }

    const paginaActual = Math.max(parseInt(page, 10) || 1, 1);
    const limiteActual = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (paginaActual - 1) * limiteActual;

    const [registros, total] = await Promise.all([
      HistorialAccion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limiteActual),
      HistorialAccion.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: registros.length,
      total,
      data: registros
    });
  } catch (error) {
    next(error);
  }
};
