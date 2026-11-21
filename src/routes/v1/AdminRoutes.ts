import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/authMiddleware.js';
import { listOffices, approveOffice, rejectOffice } from '../../controllers/v1/AdminController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/offices', listOffices);
router.post('/offices/:id/approve', approveOffice);
router.post('/offices/:id/reject', rejectOffice);

export default router;
