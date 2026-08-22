import express from 'express';
import { obtenerRegistroPagos } from '../controllers/registroPagoController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Solo para diagnóstico de desarrollador/administración: no es información para el
// cobrador ni para el cliente.
router.use(protect);
router.use(requireRole('administrador', 'ceo'));

router.get('/', obtenerRegistroPagos);

export default router;
