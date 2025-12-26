import express from 'express';
import {
  obtenerTodasProrrogas,
  obtenerProrrogasPorCredito,
  guardarProrrogas,
  eliminarProrroga
} from '../controllers/prorrogaController.js';

const router = express.Router();

// Obtener TODAS las prórrogas (para inicialización)
router.get('/', obtenerTodasProrrogas);

// Obtener prórrogas de un crédito
router.get('/creditos/:clienteId/:creditoId/prorrogas', obtenerProrrogasPorCredito);

// Guardar prórrogas para un crédito
router.post('/creditos/:clienteId/:creditoId/prorrogas', guardarProrrogas);

// Eliminar una prórroga específica
router.delete('/creditos/:clienteId/:creditoId/prorrogas/:nroCuota', eliminarProrroga);

export default router;
