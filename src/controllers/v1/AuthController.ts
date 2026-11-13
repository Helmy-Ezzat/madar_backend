import { Request, Response } from 'express';
import * as UserService from '../../services/UserService.js';

// POST /api/v1/auth/sync
export const syncUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await UserService.syncUser(req.user!);
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ success: false, error: 'Failed to sync user.' });
    }
};

// GET /api/v1/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await UserService.getUserByFirebaseUid(req.user!.uid);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found.' });
            return;
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user.' });
    }
};
