import mongoose from 'mongoose';

const tareaSchema = new mongoose.Schema({
    texto: {
        type: String,
        required: true,
        trim: true
    },
    completada: {
        type: Boolean,
        default: false
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const seccionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tareas: [tareaSchema],
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: String,
        default: 'ceo'
    }
}, {
    timestamps: true
});

const Seccion = mongoose.model('Seccion', seccionSchema);

export default Seccion;
