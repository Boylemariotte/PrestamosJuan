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

// Máximo de días hacia el futuro permitido para una prórroga
const MAX_DIAS_PRORROGA = 20;

// Guardar o actualizar prórrogas para un crédito (bulk upsert)
export const guardarProrrogas = async (req, res) => {
  try {
    const { clienteId, creditoId, prorrogas } = req.body; // prorrogas: [{ nroCuota, fechaProrroga }, ...]

    // Validar que ninguna prórroga exceda el máximo permitido
    // (protege contra errores de digitación como invertir día/mes)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + MAX_DIAS_PRORROGA);
    fechaLimite.setHours(23, 59, 59, 999);

    for (const { nroCuota, fechaProrroga } of prorrogas) {
      const fecha = new Date(fechaProrroga);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({ success: false, message: `Fecha de prórroga inválida para la cuota #${nroCuota}` });
      }
      if (fecha > fechaLimite) {
        return res.status(400).json({
          success: false,
          message: `La prórroga de la cuota #${nroCuota} excede el máximo de ${MAX_DIAS_PRORROGA} días (fecha recibida: ${String(fechaProrroga).split('T')[0]})`
        });
      }
    }

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
