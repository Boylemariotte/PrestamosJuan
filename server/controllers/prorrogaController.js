import ProrrogaCuota from '../models/ProrrogaCuota.js';

// Obtener todas las prórrogas (para vista general como Día de Cobro)
export const obtenerTodasProrrogas = async (req, res) => {
  try {
    const prorrogas = await ProrrogaCuota.find({});
    res.json({ success: true, data: prorrogas });
  } catch (error) {
    console.error('Error al obtener todas las prórrogas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener prórrogas' });
  }
};

// Obtener todas las prórrogas de un crédito
export const obtenerProrrogasPorCredito = async (req, res) => {
  try {
    const { clienteId, creditoId } = req.params;
    const prorrogas = await ProrrogaCuota.find({ clienteId, creditoId });
    res.json({ success: true, data: prorrogas });
  } catch (error) {
    console.error('Error al obtener prórrogas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener prórrogas' });
  }
};

// Guardar o actualizar prórrogas para un crédito (bulk upsert)
export const guardarProrrogas = async (req, res) => {
  try {
    const { clienteId, creditoId, prorrogas } = req.body; // prorrogas: [{ nroCuota, fechaProrroga }, ...]
    
    const bulkOps = prorrogas.map(({ nroCuota, fechaProrroga }) => ({
      updateOne: {
        filter: { clienteId, creditoId, nroCuota },
        update: { 
          fechaProrroga: new Date(fechaProrroga),
          fechaModificacion: new Date()
        },
        upsert: true
      }
    }));

    await ProrrogaCuota.bulkWrite(bulkOps);
    
    res.json({ success: true, message: 'Prórrogas guardadas correctamente' });
  } catch (error) {
    console.error('Error al guardar prórrogas:', error);
    res.status(500).json({ success: false, message: 'Error al guardar prórrogas' });
  }
};

// Eliminar una prórroga específica
export const eliminarProrroga = async (req, res) => {
  try {
    const { clienteId, creditoId, nroCuota } = req.params;
    await ProrrogaCuota.deleteOne({ clienteId, creditoId, nroCuota });
    res.json({ success: true, message: 'Prórroga eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar prórroga:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar prórroga' });
  }
};
