import SyncError from '../models/SyncError.js';

/**
 * @desc    Obtener los errores de sincronización Credito -> Cliente.creditos
 *          (por defecto solo los no resueltos, más recientes primero)
 * @route   GET /api/sync-errors
 * @access  Private (administrador/ceo)
 */
export const getSyncErrors = async (req, res, next) => {
  try {
    const { incluirResueltos } = req.query;
    const query = incluirResueltos === 'true' ? {} : { resuelto: false };

    const errores = await SyncError.find(query)
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json({
      success: true,
      count: errores.length,
      data: errores
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marcar un error de sincronización como resuelto (por ejemplo, después de
 *          correr el script de reconciliación)
 * @route   PUT /api/sync-errors/:id/resolver
 * @access  Private (administrador/ceo)
 */
export const resolverSyncError = async (req, res, next) => {
  try {
    const syncError = await SyncError.findByIdAndUpdate(
      req.params.id,
      { resuelto: true, fechaResuelto: new Date() },
      { new: true }
    );

    if (!syncError) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: syncError
    });
  } catch (error) {
    next(error);
  }
};
