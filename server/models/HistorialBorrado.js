import mongoose from 'mongoose';

const historialBorradoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        enum: ['cliente', 'credito', 'nota', 'abono', 'multa', 'movimiento-caja', 'visita']
    },
    idOriginal: {
        type: String,
        required: true
    },
    detalles: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
        required: true
    },
    usuarioNombre: {
        type: String,
        required: true
    },
    fechaBorrado: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Índice para búsquedas rápidas por tipo y fecha
historialBorradoSchema.index({ tipo: 1, fechaBorrado: -1 });
historialBorradoSchema.index({ usuario: 1 });

const HistorialBorrado = mongoose.model('HistorialBorrado', historialBorradoSchema);

export default HistorialBorrado;
