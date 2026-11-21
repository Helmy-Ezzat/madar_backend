import { Request, Response } from 'express';
import { NotificationService } from '../../services/NotificationService.js';

// POST /api/v1/notifications/register-token
export const registerToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.body?.token;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, error: 'Token is required.' });
            return;
        }
        const result = await NotificationService.registerToken(req.user!.uid, token);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error registering FCM token:', error);
        res.status(500).json({ success: false, error: 'Failed to register token.' });
    }
};

// POST /api/v1/notifications/unregister-token
export const unregisterToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.body?.token;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, error: 'Token is required.' });
            return;
        }
        const result = await NotificationService.unregisterToken(req.user!.uid, token);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error unregistering FCM token:', error);
        res.status(500).json({ success: false, error: 'Failed to unregister token.' });
    }
};

// POST /api/v1/notifications/test - sends a demo notification to the caller's devices
export const testNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await NotificationService.sendTestToUser(req.user!.uid);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ success: false, error: 'Failed to send test notification.' });
    }
};
