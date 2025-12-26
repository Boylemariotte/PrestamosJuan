import express from 'express';
import { 
  obtenerOrdenesPorFecha, 
  guardarOrdenes, 
  eliminarOrden 
} from '../controllers/ordenCobroController.js';

const router = express.Router();

// Obtener órdenes de cobro para una fecha específica
router.get('/ordenes-cobro/:fecha', obtenerOrdenesPorFecha);

// Guardar órdenes de cobro para una fecha
router.post('/ordenes-cobro', guardarOrdenes);

// Eliminar una orden específica
router.delete('/ordenes-cobro/:fecha/:clienteId', eliminarOrden);

export default router;
