import { Router } from 'express';
import {
    getJobs,
    getJobById,
    getOffices,
    getLocations,
    getSpecializations,
} from '../../controllers/v1/JobController.js';

const router = Router();

// NOTE: Static routes (/offices, /locations, /specializations) MUST be declared
// before the dynamic route (/:id) to avoid Express matching them as an ID.
router.get('/offices', getOffices);
router.get('/locations', getLocations);
router.get('/specializations', getSpecializations);
router.get('/', getJobs);
router.get('/:id', getJobById);

export default router;
