import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/authMiddleware.js';
import { listOffices, approveOffice, rejectOffice, listJobs, approveJob, rejectJob, createPlatformJob, lookupUser, cleanupPentestData } from '../../controllers/v1/AdminController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/offices', listOffices);
router.post('/offices/:id/approve', approveOffice);
router.post('/offices/:id/reject', rejectOffice);
router.get('/users/lookup', lookupUser);
router.get('/jobs', listJobs);
router.post('/jobs', createPlatformJob);
router.post('/jobs/:id/approve', approveJob);
router.post('/cleanup/pentest', cleanupPentestData);
router.post('/jobs/:id/reject', rejectJob);

export default router;
