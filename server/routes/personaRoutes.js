import express from 'express';
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  getPermissions
} from '../controllers/personaController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(requireRole('administrador', 'ceo'), getPersonas)
  .post(requireRole('ceo'), createPersona);

router.route('/:id')
  .get(getPersona)
  .put(updatePersona)
  .delete(requireRole('ceo'), deletePersona);

router.route('/:id/permissions')
  .get(getPermissions);

export default router;

