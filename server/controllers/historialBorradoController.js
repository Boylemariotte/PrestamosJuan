import HistorialBorrado from '../models/HistorialBorrado.js';

/**
 * @desc    Obtener todo el historial de borrados
 * @route   GET /api/historial-borrados
 * @access  Private (Admin, CEO)
 */
export const obtenerHistorial = async (req, res, next) => {
    try {
        const { tipo, desde, hasta } = req.query;
        let query = {};

        if (tipo) query.tipo = tipo;

        if (desde || hasta) {
            query.fechaBorrado = {};
            if (desde) query.fechaBorrado.$gte = new Date(desde);
            if (hasta) query.fechaBorrado.$lte = new Date(hasta);
        }

        const historial = await HistorialBorrado.find(query)
            .sort({ fechaBorrado: -1 })
            .limit(500);

        res.status(200).json({
            success: true,
            count: historial.length,
            data: historial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtener un registro específico por ID
 * @route   GET /api/historial-borrados/:id
 * @access  Private (Admin, CEO)
 */
export const obtenerRegistro = async (req, res, next) => {
    try {
        const registro = await HistorialBorrado.findById(req.params.id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: registro
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar un registro específico por ID
 * @route   DELETE /api/historial-borrados/:id
 * @access  Private (Admin, CEO)
 */
export const eliminarRegistro = async (req, res, next) => {
    try {
        const registro = await HistorialBorrado.findByIdAndDelete(req.params.id);

        if (!registro) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Vaciar todo el historial de borrados
 * @route   DELETE /api/historial-borrados
 * @access  Private (CEO)
 */
export const vaciarHistorial = async (req, res, next) => {
    try {
        await HistorialBorrado.deleteMany({});

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Función de utilidad para guardar en el historial (no es un endpoint directo)
 */
export const registrarBorrado = async ({ tipo, idOriginal, detalles, usuario, usuarioNombre, metadata }) => {
    try {
        await HistorialBorrado.create({
            tipo,
            idOriginal,
            detalles,
            usuario,
            usuarioNombre,
            metadata
        });
        return true;
    } catch (error) {
        console.error('Error al registrar borrado en historial:', error);
        return false;
    }
};
