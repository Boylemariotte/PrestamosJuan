import mongoose from 'mongoose';

const movimientoCajaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso', 'prestamo'],
    required: true
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  papeleria: {
    type: Number,
    default: 0,
    min: 0
  },
  montoEntregado: {
    type: Number,
    default: 0,
    min: 0
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
movimientoCajaSchema.index({ fecha: -1 });
movimientoCajaSchema.index({ tipo: 1 });
movimientoCajaSchema.index({ fechaCreacion: -1 });

const MovimientoCaja = mongoose.model('MovimientoCaja', movimientoCajaSchema);

export default MovimientoCaja;

