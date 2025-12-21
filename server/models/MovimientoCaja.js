import mongoose from 'mongoose';

const movimientoCajaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['inicioCaja', 'gasto', 'prestamo', 'retiroPapeleria', 'ingreso', 'egreso'],
    required: true
  },
  tipoMovimiento: {
    type: String,
    default: 'flujoCaja',
    trim: true
  },
  concepto: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    trim: true
  },
  caja: {
    type: Number,
    default: null,
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
movimientoCajaSchema.index({ fecha: -1 });
movimientoCajaSchema.index({ tipo: 1 });
movimientoCajaSchema.index({ fechaCreacion: -1 });

const MovimientoCaja = mongoose.model('MovimientoCaja', movimientoCajaSchema);

export default MovimientoCaja;

