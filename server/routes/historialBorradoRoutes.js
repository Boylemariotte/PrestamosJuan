import express from 'express';
import { obtenerHistorial, obtenerRegistro, eliminarRegistro, vaciarHistorial } from '../controllers/historialBorradoController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador o superior
router.use(protect);
router.use(requireRole('administrador', 'ceo'));

router.get('/', obtenerHistorial);
router.get('/:id', obtenerRegistro);
router.delete('/:id', eliminarRegistro);
router.delete('/', requireRole('ceo'), vaciarHistorial);

export default router;
