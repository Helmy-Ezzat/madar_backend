import { Router } from 'express';
import {
    getJobs,
    getJobById,
    getOffices,
    getLocations,
    getSpecializations,
    getSuggestions,
    createMyOfficeJob,
    getMyOfficeJobs,
    updateMyOfficeJob,
    deleteMyOfficeJob,
    getMyOfficeJobApplicants,
    applyToJob,
    getAppliedState,
} from '../../controllers/v1/JobController.js';
import { requireAuth, requireApprovedOffice } from '../../middleware/authMiddleware.js';

const router = Router();

// NOTE: Static routes (/offices, /locations, /specializations, /suggest) MUST be declared
// before the dynamic route (/:id) to avoid Express matching them as an ID.
router.get('/offices', getOffices);
router.get('/locations', getLocations);
router.get('/specializations', getSpecializations);
router.get('/suggest', getSuggestions);

// Office dashboard (approved offices only) — static, must stay before /:id
router.post('/mine', requireAuth, requireApprovedOffice, createMyOfficeJob);
router.get('/mine', requireAuth, requireApprovedOffice, getMyOfficeJobs);
router.patch('/mine/:id', requireAuth, requireApprovedOffice, updateMyOfficeJob);
router.delete('/mine/:id', requireAuth, requireApprovedOffice, deleteMyOfficeJob);
router.get('/mine/:id/applicants', requireAuth, requireApprovedOffice, getMyOfficeJobApplicants);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/:id/apply', requireAuth, applyToJob);
router.get('/:id/applied', requireAuth, getAppliedState);

export default router;
