import mongoose from 'mongoose';

const solicitanteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cc: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccionCasa: {
    type: String,
    trim: true
  },
  barrioCasa: {
    type: String,
    trim: true
  },
  direccionTrabajo: {
    type: String,
    trim: true
  },
  barrioTrabajo: {
    type: String,
    trim: true
  }
}, { _id: false });

const fiadorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cc: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccionCasa: {
    type: String,
    trim: true
  },
  barrioCasa: {
    type: String,
    trim: true
  },
  direccionTrabajo: {
    type: String,
    trim: true
  },
  barrioTrabajo: {
    type: String,
    trim: true
  }
}, { _id: false });

const visitaSchema = new mongoose.Schema({
  fechaAgendamiento: {
    type: Date,
    required: true
  },
  fechaVisita: {
    type: Date,
    required: true
  },
  tipoPrestamo: {
    type: String,
    trim: true
  },
  numeroCliente: {
    type: String,
    trim: true
  },
  valorPrestamo: {
    type: Number,
    default: 0
  },
  valorCuota: {
    type: Number,
    default: 0
  },
  solicitante: {
    type: solicitanteSchema,
    required: true
  },
  fiador: {
    type: fiadorSchema,
    required: true
  },
  observaciones: {
    type: String,
    trim: true,
    default: ''
  },
  completada: {
    type: Boolean,
    default: false
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

// Índices para búsquedas rápidas
visitaSchema.index({ fechaVisita: 1 });
visitaSchema.index({ fechaAgendamiento: 1 });
visitaSchema.index({ completada: 1 });
visitaSchema.index({ 'solicitante.nombre': 'text', 'solicitante.cc': 'text' });
visitaSchema.index({ 'fiador.nombre': 'text', 'fiador.cc': 'text' });

const Visita = mongoose.model('Visita', visitaSchema);

export default Visita;

