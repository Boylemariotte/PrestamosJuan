import express from 'express';
import {
  getCreditos,
  getCredito,
  createCredito,
  updateCredito,
  deleteCredito,
  registrarPago,
  agregarNota
} from '../controllers/creditoController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(authorize('verCreditosActivos', 'verCreditosFinalizados'), getCreditos)
  .post(authorize('crearCreditos'), createCredito);

router.route('/:id')
  .get(authorize('verCreditosActivos', 'verCreditosFinalizados'), getCredito)
  .put(authorize('editarCreditos'), updateCredito)
  .delete(authorize('eliminarCreditos'), deleteCredito);

router.route('/:id/pagos')
  .put(authorize('registrarPagos'), registrarPago);

router.route('/:id/notas')
  .post(authorize('agregarNotas'), agregarNota);

export default router;

