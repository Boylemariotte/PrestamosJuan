import mongoose from 'mongoose';

const totalMultasSchema = new mongoose.Schema({
    nombrePersona: {
        type: String,
        required: [true, 'El nombre de la persona es requerido'],
        trim: true
    },
    fecha: {
        type: Date,
        required: [true, 'La fecha es requerida'],
        default: Date.now
    },
    valor: {
        type: Number,
        required: [true, 'El valor es requerido'],
        min: [0, 'El valor no puede ser negativo']
    },
    registradoPor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Persona',
        required: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índice para búsquedas rápidas por fecha y nombre
totalMultasSchema.index({ fecha: -1 });
totalMultasSchema.index({ nombrePersona: 'text' });

const TotalMultas = mongoose.model('TotalMultas', totalMultasSchema);

export default TotalMultas;
