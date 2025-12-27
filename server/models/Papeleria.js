import mongoose from 'mongoose';

const papeleriaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'retiro', 'ajuste'],
    required: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  unidad: {
    type: String,
    default: 'unidad',
    trim: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  prestamoId: {
    type: String,
    trim: true
  },
  movimientoId: {
    type: String,
    trim: true
  },
  registradoPor: {
    type: String,
    trim: true,
    default: 'Sistema'
  },
  ciudadPapeleria: {
    type: String,
    enum: ['Tuluá', 'Guadalajara de Buga'],
    default: 'Tuluá',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
papeleriaSchema.index({ fecha: -1 });
papeleriaSchema.index({ tipo: 1 });
papeleriaSchema.index({ prestamoId: 1 });
papeleriaSchema.index({ ciudadPapeleria: 1 });

const Papeleria = mongoose.model('Papeleria', papeleriaSchema);

export default Papeleria;

