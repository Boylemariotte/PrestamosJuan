import mongoose from 'mongoose';

// Bitácora general de acciones (crear/editar/activar/desactivar/renovar) sobre créditos,
// clientes, abonos, multas, descuentos y notas. Complementa a RegistroPago (que solo cubre
// transiciones pagado/despagado de cuotas) y a HistorialBorrado (que solo cubre eliminaciones).
// Igual que RegistroPago: es solo para diagnóstico/trazabilidad, nunca se usa para calcular nada.
const historialAccionSchema = new mongoose.Schema({
  accion: {
    type: String,
    required: true,
    enum: ['crear', 'editar', 'activar', 'desactivar', 'renovar']
  },
  entidad: {
    type: String,
    required: true,
    enum: ['credito', 'cliente', 'abono', 'abonoMulta', 'multa', 'descuento', 'nota']
  },
  entidadId: {
    type: String,
    required: true
  },
  creditoId: {
    type: String,
    default: null
  },
  clienteId: {
    // String y no ObjectId: Cliente._id es String (soporta IDs numericos heredados).
    type: String,
    default: null
  },
  clienteNombre: {
    type: String,
    default: null
  },
  descripcion: {
    type: String,
    required: true
  },
  antes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  despues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    default: null
  },
  usuarioNombre: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

historialAccionSchema.index({ createdAt: -1 });
historialAccionSchema.index({ entidad: 1, entidadId: 1, createdAt: -1 });
historialAccionSchema.index({ clienteId: 1, createdAt: -1 });
historialAccionSchema.index({ creditoId: 1, createdAt: -1 });

const HistorialAccion = mongoose.model('HistorialAccion', historialAccionSchema);

export default HistorialAccion;
