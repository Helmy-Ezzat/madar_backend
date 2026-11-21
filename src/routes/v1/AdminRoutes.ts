import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/authMiddleware.js';
import { getCounts, listOffices, approveOffice, rejectOffice, suspendOffice, unsuspendOffice, listJobs, approveJob, rejectJob, suspendJob, unsuspendJob, deleteJob, createPlatformJob, lookupUser, cleanupPentestData, approveAllJobs } from '../../controllers/v1/AdminController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/counts', getCounts);
router.get('/offices', listOffices);
router.post('/offices/:id/approve', approveOffice);
router.post('/offices/:id/reject', rejectOffice);
router.post('/offices/:id/suspend', suspendOffice);
router.post('/offices/:id/unsuspend', unsuspendOffice);
router.get('/users/lookup', lookupUser);
router.get('/jobs', listJobs);
router.post('/jobs', createPlatformJob);
router.post('/jobs/:id/approve', approveJob);
router.post('/cleanup/pentest', cleanupPentestData);
router.post('/jobs/approve-all', approveAllJobs);
router.post('/jobs/:id/reject', rejectJob);
router.post('/jobs/:id/suspend', suspendJob);
router.post('/jobs/:id/unsuspend', unsuspendJob);
router.delete('/jobs/:id', deleteJob);

export default router;
