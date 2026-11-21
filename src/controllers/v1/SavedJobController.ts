import { Request, Response } from 'express';
import { SavedJobService, SavedJobNotFoundError } from '../../services/SavedJobService.js';

// GET /api/v1/saved-jobs
export const getSavedJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        const savedJobs = await SavedJobService.listSavedJobs(req.user!.uid);
        res.json({ success: true, data: savedJobs });
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch saved jobs.' });
    }
};

// POST /api/v1/saved-jobs/:jobId  (toggle — POST because CORS allows GET/POST only)
export const toggleSavedJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await SavedJobService.toggleSavedJob(req.user!.uid, String(req.params.jobId));
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof SavedJobNotFoundError) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        console.error('Error toggling saved job:', error);
        res.status(500).json({ success: false, error: 'Failed to update saved job.' });
    }
};
