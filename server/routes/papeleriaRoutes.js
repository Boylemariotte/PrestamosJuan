import express from 'express';
import {
  getPapeleria,
  createPapeleria,
  updatePapeleria,
  deletePapeleria,
  resetPapeleria
} from '../controllers/papeleriaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Rutas específicas deben ir antes de las paramétricas
router.delete('/reset', resetPapeleria);

router.route('/')
  .get(getPapeleria)
  .post(createPapeleria);

router.route('/:id')
  .put(updatePapeleria)
  .delete(deletePapeleria);

export default router;

