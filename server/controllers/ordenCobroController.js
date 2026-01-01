import OrdenCobro from '../models/OrdenCobro.js';

// Obtener órdenes de cobro para una fecha específica
export const obtenerOrdenesPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const ordenes = await OrdenCobro.find({
            fecha: new Date(fecha)
        }).sort({ orden: 1 });

        // Convertir a formato plano para fácil acceso en frontend
        const ordenesMap = {};
        ordenes.forEach(orden => {
            ordenesMap[orden.clienteId] = orden.orden;
        });

        res.json({ success: true, data: ordenesMap });
    } catch (error) {
        console.error('Error al obtener órdenes de cobro:', error);
        res.status(500).json({ success: false, message: 'Error al obtener órdenes de cobro' });
    }
};

// Guardar órdenes de cobro para una fecha (bulk upsert)
export const guardarOrdenes = async (req, res) => {
    try {
        const { fecha, ordenes } = req.body; // ordenes: { clienteId: orden, ... }

        const bulkOps = Object.entries(ordenes).map(([clienteId, orden]) => ({
            updateOne: {
                filter: { fecha: new Date(fecha), clienteId },
                update: {
                    orden,
                    fechaModificacion: new Date()
                },
                upsert: true
            }
        }));

        await OrdenCobro.bulkWrite(bulkOps);

        res.json({ success: true, message: 'Órdenes de cobro guardadas correctamente' });
    } catch (error) {
        console.error('Error al guardar órdenes de cobro:', error);
        res.status(500).json({ success: false, message: 'Error al guardar órdenes de cobro' });
    }
};

// Eliminar una orden específica
export const eliminarOrden = async (req, res) => {
    try {
        const { fecha, clienteId } = req.params;
        await OrdenCobro.deleteOne({ fecha: new Date(fecha), clienteId });
        res.json({ success: true, message: 'Orden de cobro eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar orden de cobro:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar orden de cobro' });
    }
};
