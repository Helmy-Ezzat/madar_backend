import { Request, Response } from 'express';
import { User } from '../../models/User.js';
import { Job } from '../../models/Job.js';

// GET /api/v1/admin/offices?status=pending|approved|rejected|all
export const listOffices = async (req: Request, res: Response): Promise<void> => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    const filter: Record<string, unknown> = { role: 'office' };
    if (status !== 'all') filter.officeStatus = status;

    const offices = await User.find(filter)
        .select('email displayName officeName licenseNumber officeStatus createdAt')
        .sort({ createdAt: -1 })
        .exec();

    res.json({ success: true, data: offices });
};

// POST /api/v1/admin/offices/:id/approve
export const approveOffice = async (req: Request, res: Response): Promise<void> => {
    const office = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'office' },
        { officeStatus: 'approved' },
        { new: true },
    );
    if (!office) {
        res.status(404).json({ success: false, error: 'Office not found.' });
        return;
    }
    res.json({ success: true, data: office });
};

// POST /api/v1/admin/offices/:id/reject
export const rejectOffice = async (req: Request, res: Response): Promise<void> => {
    const office = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'office' },
        { officeStatus: 'rejected' },
        { new: true },
    );
    if (!office) {
        res.status(404).json({ success: false, error: 'Office not found.' });
        return;
    }
    res.json({ success: true, data: office });
};

// GET /api/v1/admin/jobs?status=pending|approved|rejected — office-posted jobs only
export const listJobs = async (req: Request, res: Response): Promise<void> => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    const filter: Record<string, unknown> = { posted_by: { $ne: '' } };
    if (status !== 'all') filter.approval_status = status;

    const jobs = await Job.find(filter)
        .select('job_info company_name license_number office_verified approval_status posted_by published_at created_at')
        .sort({ created_at: -1 })
        .limit(100)
        .exec();

    res.json({ success: true, data: jobs });
};

// POST /api/v1/admin/jobs/:id/approve
export const approveJob = async (req: Request, res: Response): Promise<void> => {
    const job = await Job.findOneAndUpdate(
        { _id: req.params.id, posted_by: { $ne: '' } },
        { approval_status: 'approved' },
        { new: true },
    );
    if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: job });
};

// POST /api/v1/admin/jobs/:id/reject
export const rejectJob = async (req: Request, res: Response): Promise<void> => {
    const job = await Job.findOneAndUpdate(
        { _id: req.params.id, posted_by: { $ne: '' } },
        { approval_status: 'rejected' },
        { new: true },
    );
    if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: job });
};
