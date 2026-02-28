import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './config/database.js';
import { applySecurityMiddleware } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Nuevo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Middleware para inyectar io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware para emitir eventos de cambio automáticamente
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Ignorar login u operaciones de auth
        if (!req.originalUrl.includes('/auth/')) {
          io.emit('updateRouteEvent', {
            method: req.method,
            path: req.originalUrl,
            timestamp: Date.now()
          });
        }
      }
    });
  }
  next();
});

// Middleware de seguridad
applySecurityMiddleware(app);

// Body parser - con límite aumentado para importación de backups grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rutas de la API
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Sistema de Gestión de Préstamos',
    version: '1.0.0',
    endpoints: {
      clientes: '/api/clientes',
      creditos: '/api/creditos',
      movimientosCaja: '/api/movimientos-caja',
      alertas: '/api/alertas',
      health: '/api/health'
    }
  });
});

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Configurar puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP y Socket.io corriendo en puerto ${PORT}`);
  console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado (Rejection):', err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado (Exception):', err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

export default app;

