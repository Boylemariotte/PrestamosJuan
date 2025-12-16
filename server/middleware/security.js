import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * Configuración de CORS
 */
export const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Rate limiting para prevenir abuso
 */
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP en la ventana de tiempo
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting más estricto para rutas de autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Aplicar middleware de seguridad
 */
export const applySecurityMiddleware = (app) => {
  // Helmet para seguridad HTTP
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Rate limiting general
  app.use('/api/', limiter);
};

