import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { getSavedJobs, toggleSavedJob } from '../../controllers/v1/SavedJobController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSavedJobs);
router.post('/:jobId', toggleSavedJob);

export default router;
