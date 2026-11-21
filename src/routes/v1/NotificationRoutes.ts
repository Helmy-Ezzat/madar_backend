import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { registerToken, unregisterToken, testNotification } from '../../controllers/v1/NotificationController.js';

const router = Router();

router.use(requireAuth);

router.post('/register-token', registerToken);
router.post('/unregister-token', unregisterToken);
router.post('/test', testNotification);

export default router;
