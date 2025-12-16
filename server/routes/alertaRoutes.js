import express from 'express';
import {
  getAlertas,
  getAlerta,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  marcarComoNotificada
} from '../controllers/alertaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(getAlertas)
  .post(createAlerta);

router.route('/:id')
  .get(getAlerta)
  .put(updateAlerta)
  .delete(deleteAlerta);

router.route('/:id/notificar')
  .put(marcarComoNotificada);

export default router;

