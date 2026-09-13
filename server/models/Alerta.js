import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['mora', 'vencimiento', 'personalizada', 'recordatorio'],
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  cliente: {
    // String y no ObjectId: Cliente._id es String a propósito (soporta IDs numéricos
    // heredados de clientes previos a la migración). Con ObjectId aquí, crear una alerta
    // para un cliente con ID heredado (o crédito con formato CRED-<uuid>) fallaba con
    // BSONError, igual que pasaba con RegistroPago.
    type: String,
    ref: 'Cliente',
    default: null
  },
  credito: {
    type: String,
    ref: 'Credito',
    default: null
  },
  fechaVencimiento: {
    type: Date,
    default: null
  },
  activa: {
    type: Boolean,
    default: true
  },
  notificada: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
alertaSchema.index({ activa: 1, fechaVencimiento: 1 });
alertaSchema.index({ cliente: 1 });
alertaSchema.index({ credito: 1 });
alertaSchema.index({ notificada: 1 });

const Alerta = mongoose.model('Alerta', alertaSchema);

export default Alerta;