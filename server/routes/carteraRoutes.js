import express from 'express';
import {
    getCarteras,
    getCarteraById,
    createCartera,
    updateCartera,
    deleteCartera,
    deleteCarteraPermanente
} from '../controllers/carteraController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, getCarteras)
    .post(protect, requireRole('ceo'), createCartera);

router.delete('/:id/permanente', protect, requireRole('ceo'), deleteCarteraPermanente);

router.route('/:id')
    .get(protect, getCarteraById)
    .put(protect, requireRole('ceo'), updateCartera)
    .delete(protect, requireRole('ceo'), deleteCartera);

export default router;
