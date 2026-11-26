import express from 'express';
import {
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  updateCoordenadas,
  archivarCliente,
  desarchivarCliente,
  getPosicionesDisponibles,
  getHistorialDocumento,
  moverSeccionCliente
} from '../controllers/clienteController.js';
import { protect, authorize, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(authorize('verClientes'), getClientes)
  .post(authorize('crearClientes'), createCliente);

// Rutas específicas deben ir ANTES de la ruta genérica /:id
router.route('/:id/archivar')
  .put(authorize('editarClientes'), archivarCliente);

router.route('/:id/desarchivar')
  .put(authorize('editarClientes'), desarchivarCliente);

// Mover al cliente de sección (Semanal <-> Quincenal/Mensual), usado desde la renovación
router.route('/:id/mover-seccion')
  .put(authorize('editarClientes'), moverSeccionCliente);

router.route('/posiciones-disponibles/:cartera')
  .get(authorize('verClientes'), getPosicionesDisponibles);

// Ruta para buscar historial de un documento (cédula)
router.route('/historial-documento/:documento')
  .get(authorize('verClientes'), getHistorialDocumento);

router.route('/:id/coordenadas')
  .put(updateCoordenadas);

router.route('/:id')
  .get(authorize('verClientes'), getCliente)
  .put(authorize('editarClientes'), updateCliente)
  .delete(requireRole('ceo'), deleteCliente);

export default router;

