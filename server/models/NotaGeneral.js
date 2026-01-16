import mongoose from 'mongoose';

const notaGeneralSchema = new mongoose.Schema({
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

const NotaGeneral = mongoose.model('NotaGeneral', notaGeneralSchema);

export default NotaGeneral;
