import { Request, Response } from 'express';
import * as JobService from '../../services/JobService.js';
import mongoose from 'mongoose';

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
    const { items, total } = await JobService.getSpecializations();
    // data stays the top-20 array for existing consumers; total is the real distinct count
    res.json({ success: true, data: items, total });
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

export const healthCheck = (req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
        return res.status(503).json({
            status: 'DOWN',
            message: 'Database connection lost'
        });
    }

    return res.status(200).json({
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};
// GET /api/v1/jobs/suggest?q=

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
        res.json({ success: true, data: { titles: [], locations: [] } });
        return;
    }

    const data = await JobService.getSuggestions(q);
    res.json({ success: true, data });
};

// ---------------------------------------------------------------------------
// Office dashboard (مكاتب إلحاق العمالة) and applications
// ---------------------------------------------------------------------------

const parseOfficeJobInput = (body: Record<string, unknown>): { ok: true; input: JobService.OfficeJobInput } | { ok: false; error: string } => {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
    const salary = typeof body.salary === 'string' ? body.salary.trim() : undefined;
    const experience = typeof body.experience === 'string' ? body.experience.trim() : undefined;

    if (!title || !location || !summary) {
        return { ok: false, error: 'المسمى الوظيفي والمدينة وتفاصيل الوظيفة حقول مطلوبة.' };
    }
    return { ok: true, input: { title, location, summary, salary, experience } };
};

// POST /api/v1/jobs/mine
export const createMyOfficeJob = async (req: Request, res: Response): Promise<void> => {
    const parsed = parseOfficeJobInput(req.body ?? {});
    if (!parsed.ok) {
        res.status(400).json({ success: false, error: parsed.error });
        return;
    }
    const job = await JobService.createOfficeJob(res.locals.dbUser, parsed.input);
    res.status(201).json({ success: true, data: job });
};

// GET /api/v1/jobs/mine
export const getMyOfficeJobs = async (_req: Request, res: Response): Promise<void> => {
    const jobs = await JobService.getOfficeJobs(res.locals.dbUser.firebaseUid);
    res.json({ success: true, data: jobs });
};

// PATCH /api/v1/jobs/mine/:id
export const updateMyOfficeJob = async (req: Request, res: Response): Promise<void> => {
    const job = await JobService.updateOfficeJob(res.locals.dbUser.firebaseUid, req.params.id as string, req.body ?? {});
    if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: job });
};

// DELETE /api/v1/jobs/mine/:id
export const deleteMyOfficeJob = async (req: Request, res: Response): Promise<void> => {
    const deleted = await JobService.deleteOfficeJob(res.locals.dbUser.firebaseUid, req.params.id as string);
    if (!deleted) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: { deleted: true } });
};

// GET /api/v1/jobs/mine/:id/applicants
export const getMyOfficeJobApplicants = async (req: Request, res: Response): Promise<void> => {
    const applicants = await JobService.getOfficeJobApplicants(res.locals.dbUser.firebaseUid, req.params.id as string);
    if (!applicants) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: applicants });
};

// POST /api/v1/jobs/:id/apply
export const applyToJob = async (req: Request, res: Response): Promise<void> => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const note = typeof req.body?.note === 'string' ? req.body.note : undefined;

    if (!name || !phone) {
        res.status(400).json({ success: false, error: 'الاسم ورقم الجوال مطلوبان.' });
        return;
    }

    const result = await JobService.applyToJob(req.user!.uid, req.user!.email ?? '', req.params.id as string, { name, phone, note });
    if (result === 'not_found') {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    if (result === 'duplicate') {
        res.status(409).json({ success: false, error: 'قدّمت على الوظيفة دي قبل كده.' });
        return;
    }
    res.status(201).json({ success: true, data: { applied: true } });
};

// GET /api/v1/jobs/:id/applied — has the current user applied?
export const getAppliedState = async (req: Request, res: Response): Promise<void> => {
    const applied = await JobService.hasApplied(req.user!.uid, req.params.id as string);
    res.json({ success: true, data: { applied } });
};
