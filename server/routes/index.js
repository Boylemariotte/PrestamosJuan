import express from 'express';
import authRoutes from './authRoutes.js';
import personaRoutes from './personaRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import creditoRoutes from './creditoRoutes.js';
import movimientoCajaRoutes from './movimientoCajaRoutes.js';
import alertaRoutes from './alertaRoutes.js';
import visitaRoutes from './visitaRoutes.js';
import backupRoutes from './backupRoutes.js';

const router = express.Router();

// Rutas de autenticación (públicas)
router.use('/auth', authRoutes);

// Rutas de la API (protegidas)
router.use('/personas', personaRoutes);
router.use('/clientes', clienteRoutes);
router.use('/creditos', creditoRoutes);
router.use('/movimientos-caja', movimientoCajaRoutes);
router.use('/alertas', alertaRoutes);
router.use('/visitas', visitaRoutes);
router.use('/backup', backupRoutes);

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default router;

