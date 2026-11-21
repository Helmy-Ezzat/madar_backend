import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/authMiddleware.js';
import { registerToken, unregisterToken, testNotification } from '../../controllers/v1/NotificationController.js';

const router = Router();

router.use(requireAuth);

router.post('/register-token', registerToken);
router.post('/unregister-token', unregisterToken);
router.post('/test', requireAdmin, testNotification);

export default router;
