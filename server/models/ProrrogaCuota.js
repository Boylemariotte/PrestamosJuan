import mongoose from 'mongoose';

const prorrogaCuotaSchema = new mongoose.Schema({
  clienteId: {
    type: String,
    required: true,
    ref: 'Cliente'
  },
  creditoId: {
    type: String,
    required: true,
    ref: 'Credito'
  },
  nroCuota: {
    type: Number,
    required: true
  },
  fechaProrroga: {
    type: Date,
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
prorrogaCuotaSchema.index({ clienteId: 1, creditoId: 1, nroCuota: 1 }, { unique: true });
prorrogaCuotaSchema.index({ fechaProrroga: 1 });

const ProrrogaCuota = mongoose.model('ProrrogaCuota', prorrogaCuotaSchema);

export default ProrrogaCuota;
