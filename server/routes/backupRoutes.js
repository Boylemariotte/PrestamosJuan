import express from 'express';
import { exportData, importData, resetData } from '../controllers/backupController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
// Solo el CEO puede realizar estas operaciones críticas
router.use(requireRole('ceo'));

router.get('/export', exportData);
router.post('/import', importData);
router.delete('/reset', resetData);

export default router;
