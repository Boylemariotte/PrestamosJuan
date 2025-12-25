import mongoose from 'mongoose';

const movimientoCajaSchema = new mongoose.Schema({
  // Permitir _id personalizado (String) para migración, o generar uno nuevo si no existe
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  id: {
    type: String,
    unique: true,
    sparse: true // Permite documentos sin id (para compatibilidad con datos existentes)
  },
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

// Hook pre-save para generar id si no existe
movimientoCajaSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id?.toString() || `MOV-${new mongoose.Types.ObjectId().toString()}`;
  }
  if (!this._id) {
    this._id = this.id;
  }
  next();
});

// Índices
movimientoCajaSchema.index({ id: 1 }); // Índice para búsquedas por id

const MovimientoCaja = mongoose.model('MovimientoCaja', movimientoCajaSchema);

export default MovimientoCaja;

