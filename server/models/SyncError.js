import mongoose from 'mongoose';

/**
 * Registra los fallos al sincronizar el crédito "fuente de verdad" (colección Credito)
 * hacia su copia embebida en Cliente.creditos[]. Antes estos fallos solo se
 * imprimían con console.error y se perdían para siempre; ahora quedan
 * guardados para poder auditarlos y corregir los datos afectados.
 */
const syncErrorSchema = new mongoose.Schema({
  creditoId: {
    type: String,
    required: true
  },
  clienteId: {
    type: String,
    default: null
  },
  mensaje: {
    type: String,
    required: true
  },
  stack: String,
  intentos: {
    type: Number,
    default: 1
  },
  resuelto: {
    type: Boolean,
    default: false
  },
  fechaResuelto: Date
}, {
  timestamps: true
});

syncErrorSchema.index({ resuelto: 1, createdAt: -1 });
syncErrorSchema.index({ creditoId: 1 });

const SyncError = mongoose.model('SyncError', syncErrorSchema);

export default SyncError;
