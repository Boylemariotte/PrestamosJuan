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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null
  },
  credito: {
    type: mongoose.Schema.Types.ObjectId,
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

