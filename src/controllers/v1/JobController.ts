import { Request, Response } from 'express';
import * as JobService from '../../services/JobService.js';

// GET /api/v1/jobs

export const getJobs = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, location, company, specialization, date_posted } = req.query;

    const result = await JobService.getJobs({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search as string | undefined,
        location: location as string | undefined,
        company: company as string | undefined,
        specialization: specialization as string | undefined,
        date_posted: date_posted as string | undefined,
    });

    res.json({ success: true, data: result });
};

// GET /api/v1/jobs/offices

export const getOffices = async (_req: Request, res: Response): Promise<void> => {
    const offices = await JobService.getOffices();
    res.json({ success: true, data: offices });
};

// GET /api/v1/jobs/locations

export const getLocations = async (_req: Request, res: Response): Promise<void> => {
    const locations = await JobService.getLocations();
    res.json({ success: true, data: locations });
};

// GET /api/v1/jobs/specializations

export const getSpecializations = async (_req: Request, res: Response): Promise<void> => {
    const specializations = await JobService.getSpecializations();
    res.json({ success: true, data: specializations });
};

// GET /api/v1/jobs/:id

export const getJobById = async (req: Request, res: Response): Promise<void> => {
    const job = await JobService.getJobById(req.params.id as string);

    if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }

    res.json({ success: true, data: job });
};
