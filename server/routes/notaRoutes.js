import express from 'express';
import {
    getNotas,
    updateNotaGeneral,
    addSeccion,
    updateSeccion,
    deleteSeccion,
    addTarea,
    updateTarea,
    deleteTarea
} from '../controllers/notaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
    .get(getNotas);

router.route('/general')
    .put(updateNotaGeneral);

router.route('/secciones')
    .post(addSeccion);

router.route('/secciones/:seccionId')
    .put(updateSeccion)
    .delete(deleteSeccion);

router.route('/secciones/:seccionId/tareas')
    .post(addTarea);

router.route('/secciones/:seccionId/tareas/:tareaId')
    .put(updateTarea)
    .delete(deleteTarea);

export default router;
