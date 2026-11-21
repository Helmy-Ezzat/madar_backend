import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import {
    getSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
} from '../../controllers/v1/SavedSearchController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSavedSearches);
router.post('/', createSavedSearch);
router.delete('/:id', deleteSavedSearch);

export default router;
