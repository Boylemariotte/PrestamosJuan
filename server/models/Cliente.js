import mongoose from 'mongoose';

const fiadorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  documento: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  direccionTrabajo: {
    type: String,
    trim: true
  },
  coordenadasResidencia: {
    lat: Number,
    lon: Number,
    precision: String,
    timestamp: Date
  },
  coordenadasTrabajo: {
    lat: Number,
    lon: Number,
    precision: String,
    timestamp: Date
  },
  coordenadasResidenciaActualizada: Date,
  coordenadasTrabajoActualizada: Date
}, { _id: false });

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  documento: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  direccionTrabajo: {
    type: String,
    trim: true
  },
  correo: {
    type: String,
    trim: true,
    lowercase: true
  },
  fiador: {
    type: fiadorSchema,
    default: null
  },
  cartera: {
    type: String,
    enum: ['K1', 'K2'],
    default: 'K1'
  },
  posicion: {
    type: Number,
    default: null
  },
  tipoPagoEsperado: {
    type: String,
    enum: ['semanal', 'quincenal', 'mensual', 'diario', null],
    default: null
  },
  coordenadasResidencia: {
    lat: Number,
    lon: Number,
    precision: String,
    timestamp: Date
  },
  coordenadasTrabajo: {
    lat: Number,
    lon: Number,
    precision: String,
    timestamp: Date
  },
  coordenadasResidenciaActualizada: Date,
  coordenadasTrabajoActualizada: Date,
  creditos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credito'
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas rápidas
clienteSchema.index({ documento: 1 });
clienteSchema.index({ nombre: 'text', documento: 'text', telefono: 'text' });
clienteSchema.index({ cartera: 1, posicion: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;

