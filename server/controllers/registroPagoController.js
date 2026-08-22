import RegistroPago from '../models/RegistroPago.js';

/**
 * @desc    Listar la bitácora de cambios de estado "pagado" de cuotas. Pensado para
 *          diagnóstico de desarrollador: reconstruir para un cliente/crédito puntual
 *          cuándo se marcó/desmarcó cada cuota, quién lo hizo y desde qué acción.
 * @route   GET /api/registro-pagos?clienteId=&creditoId=&nroCuota=&evento=&desde=&hasta=
 * @access  Private (administrador, ceo)
 */
export const obtenerRegistroPagos = async (req, res, next) => {
  try {
    const { clienteId, creditoId, nroCuota, evento, desde, hasta } = req.query;
    const query = {};

    if (clienteId) query.clienteId = clienteId;
    if (creditoId) query.creditoId = creditoId;
    if (nroCuota) query.nroCuota = parseInt(nroCuota, 10);
    if (evento) query.evento = evento;

    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }

    const registros = await RegistroPago.find(query)
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json({
      success: true,
      count: registros.length,
      data: registros
    });
  } catch (error) {
    next(error);
  }
};
