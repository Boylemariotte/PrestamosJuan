import express from 'express';
import {
    getNotas,
    saveNotaDiaria
} from '../controllers/notaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/diaria')
    .post(saveNotaDiaria);

router.route('/:fecha')
    .get(getNotas);

export default router;


