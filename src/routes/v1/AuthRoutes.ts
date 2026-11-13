import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { syncUser, getMe } from '../../controllers/v1/AuthController.js';

const router = Router();

router.post('/sync', requireAuth, syncUser);
router.get('/me', requireAuth, getMe);

export default router;
