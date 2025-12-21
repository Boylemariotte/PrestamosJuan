import express from 'express';
import {
  getPapeleria,
  createPapeleria,
  updatePapeleria,
  deletePapeleria
} from '../controllers/papeleriaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPapeleria)
  .post(createPapeleria);

router.route('/:id')
  .put(updatePapeleria)
  .delete(deletePapeleria);

export default router;

