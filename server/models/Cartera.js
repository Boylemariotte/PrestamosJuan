import mongoose from 'mongoose';

const seccionCarteraSchema = new mongoose.Schema({
    nombreInterno: {
        type: String, // 'semanal', 'quincenalMensual', 'general'
        required: true,
        trim: true
    },
    titulo: {
        type: String, // 'Semanal', 'Quincenal / Mensual'
        required: true,
        trim: true
    },
    capacidad: {
        type: Number,
        required: true,
        min: 1
    },
    tiposPagoPermitidos: [{
        type: String,
        enum: ['diario', 'semanal', 'quincenal', 'mensual'],
        required: true
    }]
}, { _id: false });

const carteraSchema = new mongoose.Schema({
    nombre: {
        type: String, // K1, K2, K3...
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    ciudad: {
        type: String, // Tuluá, Buga...
        required: true,
        trim: true
    },
    orden: {
        type: Number,
        required: true,
        default: 0
    },
    color: {
        type: String, // Identificador de tema (ej: 'blue', 'green', 'orange')
        default: 'blue'
    },
    secciones: [seccionCarteraSchema],
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Cartera = mongoose.model('Cartera', carteraSchema);

export default Cartera;
