import express from 'express';
import {
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  updateCoordenadas
} from '../controllers/clienteController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.route('/')
  .get(authorize('verClientes'), getClientes)
  .post(authorize('crearClientes'), createCliente);

router.route('/:id')
  .get(authorize('verClientes'), getCliente)
  .put(authorize('editarClientes'), updateCliente)
  .delete(authorize('eliminarClientes'), deleteCliente);

router.route('/:id/coordenadas')
  .put(updateCoordenadas);

export default router;

