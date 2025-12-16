import express from 'express';
import {
  getMovimientosCaja,
  getMovimientoCaja,
  createMovimientoCaja,
  updateMovimientoCaja,
  deleteMovimientoCaja
} from '../controllers/movimientoCajaController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(authorize('verCaja'), getMovimientosCaja)
  .post(authorize('gestionarCaja'), createMovimientoCaja);

router.route('/:id')
  .get(authorize('verCaja'), getMovimientoCaja)
  .put(authorize('gestionarCaja'), updateMovimientoCaja)
  .delete(authorize('gestionarCaja'), deleteMovimientoCaja);

export default router;

