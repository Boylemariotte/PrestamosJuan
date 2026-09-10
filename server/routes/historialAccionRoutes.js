import express from 'express';
import { obtenerHistorialAcciones } from '../controllers/historialAccionController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(requireRole('administrador', 'ceo'), obtenerHistorialAcciones);

export default router;
