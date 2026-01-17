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

// Schema embebido para créditos (copia completa dentro del cliente)
const cuotaEmbebidaSchema = new mongoose.Schema({
  nroCuota: Number,
  fechaProgramada: Date,
  pagado: { type: Boolean, default: false },
  fechaPago: Date,
  abonosCuota: [{
    id: String,
    valor: Number,
    fecha: Date,
    fechaCreacion: Date
  }],
  saldoPendiente: { type: Number, default: 0 },
  tieneAbono: { type: Boolean, default: false }
}, { _id: false });

const abonoEmbebidoSchema = new mongoose.Schema({
  id: String,
  valor: Number,
  descripcion: String,
  fecha: Date,
  nroCuota: Number
}, { _id: false });

const abonoMultaEmbebidoSchema = new mongoose.Schema({
  id: String,
  valor: Number,
  descripcion: String,
  fecha: Date,
  multaId: String
}, { _id: false });

const descuentoEmbebidoSchema = new mongoose.Schema({
  id: String,
  valor: Number,
  tipo: { type: String, enum: ['dias', 'papeleria'] },
  descripcion: String,
  fecha: Date
}, { _id: false });

const notaEmbebidaSchema = new mongoose.Schema({
  id: String,
  texto: String,
  fecha: Date
}, { _id: false });

const multaEmbebidaSchema = new mongoose.Schema({
  id: String,
  valor: Number,
  motivo: String,
  fecha: Date,
  pagada: { type: Boolean, default: false }
}, { _id: false });

const creditoEmbebidoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  monto: Number,
  papeleria: { type: Number, default: 0 },
  montoEntregado: Number,
  tipo: { type: String, enum: ['semanal', 'quincenal', 'mensual', 'diario'] },
  tipoQuincenal: { type: String, enum: ['1-16', '5-20', null], default: null },
  fechaInicio: Date,
  totalAPagar: Number,
  valorCuota: Number,
  numCuotas: Number,
  cuotas: [cuotaEmbebidaSchema],
  abonos: [abonoEmbebidoSchema],
  abonosMulta: [abonoMultaEmbebidoSchema],
  multas: [multaEmbebidaSchema],
  descuentos: [descuentoEmbebidoSchema],
  notas: [notaEmbebidaSchema],
  etiqueta: String,
  fechaEtiqueta: Date,
  renovado: { type: Boolean, default: false },
  fechaRenovacion: Date,
  creditoRenovacionId: String,
  esRenovacion: { type: Boolean, default: false },
  creditoAnteriorId: String,
  fechaCreacion: { type: Date, default: Date.now }
}, { _id: false });

const clienteSchema = new mongoose.Schema({
  // Permitir _id personalizado (String) para migración, o generar uno nuevo si no existe
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
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
  barrio: {
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
    enum: ['K1', 'K2', 'K3'],
    default: 'K1'
  },
  tipoPago: {
    type: String,
    trim: true
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
  // Créditos embebidos (copia completa para mantener estructura JSON original)
  creditos: [creditoEmbebidoSchema],
  esArchivado: {
    type: Boolean,
    default: false
  },
  reportado: {
    type: Boolean,
    default: true
  },
  etiqueta: {
    type: String,
    enum: ['excelente', 'bueno', 'atrasado', 'incompleto', 'vetado', 'perdido', 'sin-etiqueta'],
    default: 'sin-etiqueta'
  },
  rf: {
    type: String,
    enum: ['RF', ''],
    default: ''
  },
  fechaRF: Date,
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  enSupervision: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hook pre-save para asegurar que esArchivado, etiqueta y enSupervision siempre estén definidos
clienteSchema.pre('save', function (next) {
  if (this.esArchivado === undefined || this.esArchivado === null) {
    this.esArchivado = false;
  }
  if (this.reportado === undefined || this.reportado === null) {
    this.reportado = true;
  }
  if (this.etiqueta === undefined || this.etiqueta === null) {
    this.etiqueta = 'sin-etiqueta';
  }
  if (this.enSupervision === undefined || this.enSupervision === null) {
    this.enSupervision = false;
  }
  next();
});

// Índices para búsquedas rápidas
// Eliminado índice de "documento" porque "unique: true" ya lo crea
clienteSchema.index({ nombre: 'text', telefono: 'text' });
clienteSchema.index({ cartera: 1, posicion: 1 });
clienteSchema.index({ barrio: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;
