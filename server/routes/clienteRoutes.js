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
  getPosicionesDisponibles
} from '../controllers/clienteController.js';
import { protect, authorize } from '../middleware/auth.js';

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

router.route('/posiciones-disponibles/:cartera')
  .get(authorize('verClientes'), getPosicionesDisponibles);

router.route('/:id/coordenadas')
  .put(updateCoordenadas);

router.route('/:id')
  .get(authorize('verClientes'), getCliente)
  .put(authorize('editarClientes'), updateCliente)
  .delete(authorize('eliminarClientes'), deleteCliente);

export default router;

