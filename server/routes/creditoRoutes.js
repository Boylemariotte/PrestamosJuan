import express from 'express';
import {
  getCreditos,
  getCredito,
  createCredito,
  updateCredito,
  deleteCredito,
  registrarPago,
  agregarNota,
  agregarAbono,
  editarAbono,
  eliminarAbono,
  agregarMulta,
  editarMulta,
  eliminarMulta,
  agregarDescuento,
  eliminarNota
} from '../controllers/creditoController.js';
import { protect, authorize, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(authorize('verCreditosActivos', 'verCreditosFinalizados'), getCreditos)
  .post(authorize('crearCreditos'), createCredito);

router.route('/:id')
  .get(authorize('verCreditosActivos', 'verCreditosFinalizados'), getCredito)
  .put(authorize('editarCreditos'), updateCredito)
  .delete(requireRole('ceo'), deleteCredito);

router.route('/:id/pagos')
  .put(authorize('registrarPagos'), registrarPago);


router.route('/:id/notas')
  .post(authorize('agregarNotas'), agregarNota);

router.route('/:id/notas/:notaId')
  .delete(requireRole('ceo'), eliminarNota);

router.route('/:id/abonos')
  .post(authorize('registrarPagos'), agregarAbono);

router.route('/:id/abonos/:abonoId')
  .put(authorize('registrarPagos'), editarAbono)
  .delete(requireRole('ceo'), eliminarAbono);

router.route('/:id/multas')
  .post(authorize('registrarPagos'), agregarMulta);

router.route('/:id/multas/:multaId')
  .put(authorize('registrarPagos'), editarMulta)
  .delete(requireRole('ceo'), eliminarMulta);

router.route('/:id/descuentos')
  .post(authorize('registrarPagos'), agregarDescuento);

export default router;

