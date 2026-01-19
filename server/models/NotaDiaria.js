import mongoose from 'mongoose';

const prestamoSchema = new mongoose.Schema({
    tipo: { type: String, trim: true },
    nombre: { type: String, trim: true },
    valor: { type: String, trim: true },
    cuota: { type: Boolean, default: false },
    caja: { type: Boolean, default: false },
    libro: { type: Boolean, default: false },
    cel: { type: Boolean, default: false },
    fiador: { type: String, trim: true },
    metodoEntrega: { type: String, trim: true }
});

const tareaTrabajadorSchema = new mongoose.Schema({
    texto: { type: String, required: true },
    completada: { type: Boolean, default: false }
});

const trabajadorSchema = new mongoose.Schema({
    id: { type: Number },
    nombre: { type: String, required: true },
    tareas: [tareaTrabajadorSchema]
});

const notaDiariaSchema = new mongoose.Schema({
    fecha: {
        type: String, // Usaremos formato YYYY-MM-DD para facilitar la búsqueda exacta
        required: true,
        index: true
    },
    visitas: [{
        type: String,
        trim: true
    }],
    prestamosNuevos: [prestamoSchema],
    pendientes: [{
        type: String,
        trim: true
    }],
    trabajadores: [trabajadorSchema],
    notaGeneral: {
        type: String,
        default: '',
        trim: true
    },
    usuario: {
        type: String,
        default: 'ceo'
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar duplicados por fecha y usuario
notaDiariaSchema.index({ fecha: 1, usuario: 1 }, { unique: true });

const NotaDiaria = mongoose.model('NotaDiaria', notaDiariaSchema);

export default NotaDiaria;
