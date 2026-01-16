import NotaGeneral from '../models/NotaGeneral.js';
import Seccion from '../models/Seccion.js';

/**
 * @desc    Obtener todas las notas (nota general + secciones)
 * @route   GET /api/notas
 * @access  Private
 */
export const getNotas = async (req, res, next) => {
    try {
        let notaG = await NotaGeneral.findOne({ usuario: 'ceo' });
        if (!notaG) {
            notaG = await NotaGeneral.create({ usuario: 'ceo', notaGeneral: '' });
        }

        const secciones = await Seccion.find({ usuario: 'ceo' }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: {
                notaGeneral: notaG.notaGeneral,
                secciones: secciones
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar la nota general
 * @route   PUT /api/notas/general
 * @access  Private
 */
export const updateNotaGeneral = async (req, res, next) => {
    try {
        const { notaGeneral } = req.body;

        const notaG = await NotaGeneral.findOneAndUpdate(
            { usuario: 'ceo' },
            { notaGeneral },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: {
                notaGeneral: notaG.notaGeneral
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Agregar una nueva sección (documento independiente)
 * @route   POST /api/notas/secciones
 * @access  Private
 */
export const addSeccion = async (req, res, next) => {
    try {
        const { nombre } = req.body;

        const nuevaSeccion = await Seccion.create({
            nombre,
            tareas: [],
            fechaCreacion: new Date(),
            usuario: 'ceo'
        });

        res.status(201).json({
            success: true,
            data: nuevaSeccion
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar una sección
 * @route   PUT /api/notas/secciones/:seccionId
 * @access  Private
 */
export const updateSeccion = async (req, res, next) => {
    try {
        const { seccionId } = req.params;
        const { nombre } = req.body;

        const seccion = await Seccion.findByIdAndUpdate(
            seccionId,
            { nombre },
            { new: true }
        );

        if (!seccion) {
            return res.status(404).json({ success: false, message: 'Sección no encontrada' });
        }

        res.status(200).json({
            success: true,
            data: seccion
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar una sección
 * @route   DELETE /api/notas/secciones/:seccionId
 * @access  Private
 */
export const deleteSeccion = async (req, res, next) => {
    try {
        const { seccionId } = req.params;

        await Seccion.findByIdAndDelete(seccionId);

        res.status(200).json({
            success: true,
            message: 'Sección eliminada'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Agregar una tarea a una sección
 * @route   POST /api/notas/secciones/:seccionId/tareas
 * @access  Private
 */
export const addTarea = async (req, res, next) => {
    try {
        const { seccionId } = req.params;
        const { texto } = req.body;

        const seccion = await Seccion.findByIdAndUpdate(
            seccionId,
            {
                $push: {
                    tareas: { texto, completada: false, fechaCreacion: new Date() }
                }
            },
            { new: true }
        );

        res.status(201).json({
            success: true,
            data: seccion
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar una tarea
 * @route   PUT /api/notas/secciones/:seccionId/tareas/:tareaId
 * @access  Private
 */
export const updateTarea = async (req, res, next) => {
    try {
        const { seccionId, tareaId } = req.params;
        const updates = req.body;

        const updateQuery = {};
        for (const key in updates) {
            updateQuery[`tareas.$.${key}`] = updates[key];
        }

        const seccion = await Seccion.findOneAndUpdate(
            { _id: seccionId, 'tareas._id': tareaId },
            { $set: updateQuery },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: seccion
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar una tarea
 * @route   DELETE /api/notas/secciones/:seccionId/tareas/:tareaId
 * @access  Private
 */
export const deleteTarea = async (req, res, next) => {
    try {
        const { seccionId, tareaId } = req.params;

        const seccion = await Seccion.findByIdAndUpdate(
            seccionId,
            {
                $pull: { tareas: { _id: tareaId } }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: seccion
        });
    } catch (error) {
        next(error);
    }
};
