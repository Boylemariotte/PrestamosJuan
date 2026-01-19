import NotaDiaria from '../models/NotaDiaria.js';


/**
 * @desc    Obtener todas las notas (general + diaria por fecha)
 * @route   GET /api/notas/:fecha
 * @access  Private
 */
export const getNotas = async (req, res, next) => {
    try {
        const { fecha } = req.params; // Formato YYYY-MM-DD

        let notaD = await NotaDiaria.findOne({ fecha, usuario: 'ceo' });

        if (!notaD) {
            // Valores por defecto para una fecha nueva
            notaD = {
                fecha,
                visitas: ['', '', '', '', ''],
                prestamosNuevos: [],
                pendientes: [],
                trabajadores: [],
                notaGeneral: ''
            };
        }

        res.status(200).json({
            success: true,
            data: {
                notaGeneral: notaD.notaGeneral,
                notaDiaria: notaD
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar o crear nota diaria
 * @route   POST /api/notas/diaria
 * @access  Private
 */
export const saveNotaDiaria = async (req, res, next) => {
    try {
        const { fecha, visitas, prestamosNuevos, pendientes, trabajadores, notaGeneral } = req.body;

        const notaD = await NotaDiaria.findOneAndUpdate(
            { fecha, usuario: 'ceo' },
            { visitas, prestamosNuevos, pendientes, trabajadores, notaGeneral },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: notaD
        });
    } catch (error) {
        next(error);
    }
};

// El método updateNotaGeneral se elimina ya que ahora se incluye en saveNotaDiaria



