import Cartera from '../models/Cartera.js';

/**
 * @desc    Obtener todas las carteras activas
 * @route   GET /api/carteras
 * @access  Private
 */
export const getCarteras = async (req, res, next) => {
    try {
        const { all } = req.query;
        const query = all === 'true' ? {} : { activa: true };
        const carteras = await Cartera.find(query).sort({ orden: 1 });
        res.status(200).json({
            success: true,
            data: carteras
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtener una cartera por ID
 * @route   GET /api/carteras/:id
 * @access  Private
 */
export const getCarteraById = async (req, res, next) => {
    try {
        const cartera = await Cartera.findById(req.params.id);
        if (!cartera) {
            return res.status(404).json({
                success: false,
                error: 'Cartera no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: cartera
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Crear una nueva cartera
 * @route   POST /api/carteras
 * @access  Private (CEO only)
 */
export const createCartera = async (req, res, next) => {
    try {
        const { nombre, ciudad, orden, color, secciones } = req.body;

        const carteraExists = await Cartera.findOne({ nombre });

        if (carteraExists) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una cartera con ese nombre'
            });
        }

        const cartera = await Cartera.create({
            nombre,
            ciudad,
            orden,
            color,
            secciones
        });

        res.status(201).json({
            success: true,
            data: cartera
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualizar una cartera
 * @route   PUT /api/carteras/:id
 * @access  Private (CEO only)
 */
export const updateCartera = async (req, res, next) => {
    try {
        const { nombre, ciudad, orden, color, secciones, activa } = req.body;

        const cartera = await Cartera.findById(req.params.id);

        if (!cartera) {
            return res.status(404).json({
                success: false,
                error: 'Cartera no encontrada'
            });
        }

        cartera.nombre = nombre || cartera.nombre;
        cartera.ciudad = ciudad || cartera.ciudad;
        cartera.orden = orden !== undefined ? orden : cartera.orden;
        cartera.color = color || cartera.color;
        cartera.secciones = secciones || cartera.secciones;
        cartera.activa = activa !== undefined ? activa : cartera.activa;

        const updatedCartera = await cartera.save();

        res.status(200).json({
            success: true,
            data: updatedCartera
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar una cartera (soft delete)
 * @route   DELETE /api/carteras/:id
 * @access  Private (CEO only)
 */
export const deleteCartera = async (req, res, next) => {
    try {
        const cartera = await Cartera.findById(req.params.id);

        if (!cartera) {
            return res.status(404).json({
                success: false,
                error: 'Cartera no encontrada'
            });
        }

        cartera.activa = false;
        await cartera.save();

        res.status(200).json({
            success: true,
            message: 'Cartera desactivada correctly'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar una cartera permanentemente
 * @route   DELETE /api/carteras/:id/permanente
 * @access  Private (CEO only)
 */
export const deleteCarteraPermanente = async (req, res, next) => {
    try {
        const cartera = await Cartera.findById(req.params.id);

        if (!cartera) {
            return res.status(404).json({
                success: false,
                error: 'Cartera no encontrada'
            });
        }

        await Cartera.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Cartera eliminada permanentemente de la base de datos'
        });
    } catch (error) {
        next(error);
    }
};
