import express from 'express';
import {
    getMultas,
    getMulta,
    createMulta,
    updateMulta,
    deleteMulta
} from '../controllers/totalMultasController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router
    .route('/')
    .get(getMultas)
    .post(createMulta);

router
    .route('/:id')
    .get(getMulta)
    .put(updateMulta)
    .delete(deleteMulta);

export default router;
