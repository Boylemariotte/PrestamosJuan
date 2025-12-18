import express from 'express';
import {
  getVisitas,
  getVisita,
  createVisita,
  updateVisita,
  deleteVisita,
  completarVisita
} from '../controllers/visitaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(getVisitas)
  .post(createVisita);

router.route('/:id')
  .get(getVisita)
  .put(updateVisita)
  .delete(deleteVisita);

router.route('/:id/completar')
  .put(completarVisita);

export default router;

