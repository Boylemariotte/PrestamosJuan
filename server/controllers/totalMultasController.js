import TotalMultas from '../models/TotalMultas.js';

/**
 * @desc    Obtener todas las multas
 * @route   GET /api/total-multas
 * @access  Private
 */
export const getMultas = async (req, res, next) => {
    try {
        const { nombrePersona, fechaInicio, fechaFin, page = 1, limit = 50 } = req.query;

        const query = {};

        if (nombrePersona) {
            query.nombrePersona = { $regex: nombrePersona, $options: 'i' };
        }

        if (fechaInicio && fechaFin) {
            query.fecha = {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
            };
        } else if (fechaInicio) {
            query.fecha = { $gte: new Date(fechaInicio) };
        } else if (fechaFin) {
            query.fecha = { $lte: new Date(fechaFin) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const multas = await TotalMultas.find(query)
            .populate('registradoPor', 'nombre username')
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await TotalMultas.countDocuments(query);

        // Calcular el total de todas las multas (según el filtro)
        const agregacionTotal = await TotalMultas.aggregate([
            { $match: query },
            { $group: { _id: null, totalSum: { $sum: '$valor' } } }
        ]);

        const totalSum = agregacionTotal.length > 0 ? agregacionTotal[0].totalSum : 0;

        res.status(200).json({
            success: true,
            count: multas.length,
            total,
            totalSum,
            data: multas
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtener una multa por ID
 * @route   GET /api/total-multas/:id
 * @access  Private
 */
export const getMulta = async (req, res, next) => {
    try {
        const multa = await TotalMultas.findById(req.params.id).populate('registradoPor', 'nombre username');

        if (!multa) {
            return res.status(404).json({
                success: false,
                error: 'Multa no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: multa
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Crear una nueva multa
 * @route   POST /api/total-multas
 * @access  Private
 */
export const createMulta = async (req, res, next) => {
    try {
        const { nombrePersona, fecha, valor } = req.body;

        if (!nombrePersona || !valor) {
            return res.status(400).json({
                success: false,
                error: 'Por favor proporciona todos los campos requeridos'
            });
        }

        const multa = await TotalMultas.create({
            nombrePersona,
            fecha: fecha || Date.now(),
            valor,
            registradoPor: req.user._id
        });

        res.status(201).json({
            success: true,
            data: multa
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar una multa
 * @route   PUT /api/total-multas/:id
 * @access  Private
 */
export const updateMulta = async (req, res, next) => {
    try {
        const { nombrePersona, fecha, valor } = req.body;

        let multa = await TotalMultas.findById(req.params.id);

        if (!multa) {
            return res.status(404).json({
                success: false,
                error: 'Multa no encontrada'
            });
        }

        multa = await TotalMultas.findByIdAndUpdate(
            req.params.id,
            { nombrePersona, fecha, valor },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: multa
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar una multa
 * @route   DELETE /api/total-multas/:id
 * @access  Private
 */
export const deleteMulta = async (req, res, next) => {
    try {
        const multa = await TotalMultas.findById(req.params.id);

        if (!multa) {
            return res.status(404).json({
                success: false,
                error: 'Multa no encontrada'
            });
        }

        await TotalMultas.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Multa eliminada correctamente'
        });
    } catch (error) {
        next(error);
    }
};
