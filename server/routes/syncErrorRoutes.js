import express from 'express';
import { getSyncErrors, resolverSyncError } from '../controllers/syncErrorController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Solo administrador/ceo necesitan ver esto: son fallos internos de sincronización,
// no algo que un domiciliario/cobrador deba ver.
router.use(protect);
router.use(requireRole('administrador', 'ceo'));

router.get('/', getSyncErrors);
router.put('/:id/resolver', resolverSyncError);

export default router;
