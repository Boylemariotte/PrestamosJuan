import mongoose from 'mongoose';

const cuotaSchema = new mongoose.Schema({
  nroCuota: {
    type: Number,
    required: true
  },
  fechaProgramada: {
    type: Date,
    required: true
  },
  pagado: {
    type: Boolean,
    default: false
  },
  fechaPago: {
    type: Date,
    default: null
  },
  abonosCuota: [{
    id: String,
    valor: Number,
    fecha: Date,
    fechaCreacion: Date
  }],
  saldoPendiente: {
    type: Number,
    default: 0
  },
  tieneAbono: {
    type: Boolean,
    default: false
  },
  multas: [{
    id: String,
    valor: Number,
    motivo: String,
    fecha: Date
  }]
}, { _id: false });

const abonoSchema = new mongoose.Schema({
  id: String,
  valor: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String,
    default: 'Abono al crédito'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['abono', 'multa'],
    default: 'abono'
  },
  nroCuota: Number
}, { _id: false });

const descuentoSchema = new mongoose.Schema({
  id: String,
  valor: {
    type: Number,
    required: true
  },
  tipo: {
    type: String,
    enum: ['dias', 'papeleria'],
    required: true
  },
  descripcion: String,
  fecha: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const notaSchema = new mongoose.Schema({
  id: String,
  texto: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const creditoSchema = new mongoose.Schema({
  // Permitir _id personalizado (String) para migración, o generar uno nuevo si no existe
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  cliente: {
    type: String, // Cambiado de ObjectId a String para coincidir con el _id de Cliente
    ref: 'Cliente',
    required: true
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  papeleria: {
    type: Number,
    default: 0,
    min: 0
  },
  montoEntregado: {
    type: Number,
    required: true,
    min: 0
  },
  tipo: {
    type: String,
    enum: ['semanal', 'quincenal', 'mensual', 'diario'],
    required: true
  },
  tipoQuincenal: {
    type: String,
    enum: ['1-16', '5-20', null],
    default: null
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  totalAPagar: {
    type: Number,
    required: true,
    min: 0
  },
  valorCuota: {
    type: Number,
    required: true,
    min: 0
  },
  numCuotas: {
    type: Number,
    required: true,
    min: 1
  },
  cuotas: [cuotaSchema],
  abonos: [abonoSchema],
  descuentos: [descuentoSchema],
  notas: [notaSchema],
  etiqueta: {
    type: String,
    default: null
  },
  fechaEtiqueta: Date,
  renovado: {
    type: Boolean,
    default: false
  },
  fechaRenovacion: Date,
  creditoRenovacionId: String,
  esRenovacion: {
    type: Boolean,
    default: false
  },
  creditoAnteriorId: String,
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
creditoSchema.index({ cliente: 1 });
creditoSchema.index({ tipo: 1 });
creditoSchema.index({ fechaInicio: 1 });
creditoSchema.index({ renovado: 1 });

const Credito = mongoose.model('Credito', creditoSchema);

export default Credito;
