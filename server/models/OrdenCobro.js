import mongoose from 'mongoose';

const ordenCobroSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true
  },
  clienteId: {
    type: String,
    required: true,
    ref: 'Cliente'
  },
  orden: {
    type: Number,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas rápidas
ordenCobroSchema.index({ fecha: 1, clienteId: 1 }, { unique: true });
ordenCobroSchema.index({ fecha: 1, orden: 1 });

const OrdenCobro = mongoose.model('OrdenCobro', ordenCobroSchema);

export default OrdenCobro;
