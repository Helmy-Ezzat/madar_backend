import { Request, Response } from 'express';
import { User } from '../../models/User.js';
import { Job } from '../../models/Job.js';
import { Application } from '../../models/Application.js';
import { FcmToken } from '../../models/FcmToken.js';
import { firebaseAuth } from '../../config/firebase.js';

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
    const filter: Record<string, unknown> = { posted_by: { $exists: true, $nin: ['', null] } };
    // Jobs posted before the review flow existed have no status yet: treat as pending
    if (status === 'pending') filter.approval_status = { $in: ['pending', '', null] };
    else if (status !== 'all') filter.approval_status = status;

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
        { _id: req.params.id, posted_by: { $exists: true, $nin: ['', null] } },
        { approval_status: 'approved', published_at: new Date() },
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
        { _id: req.params.id, posted_by: { $exists: true, $nin: ['', null] } },
        { approval_status: 'rejected' },
        { new: true },
    );
    if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
    }
    res.json({ success: true, data: job });
};

// POST /api/v1/admin/jobs — publish a job in the platform's own name (مدار)
export const createPlatformJob = async (req: Request, res: Response): Promise<void> => {
    const { title, location, salary, experience, summary } = req.body ?? {};
    if (typeof title !== 'string' || typeof location !== 'string' || typeof summary !== 'string'
        || !title.trim() || !location.trim() || !summary.trim()) {
        res.status(400).json({ success: false, error: 'title, location and summary are required.' });
        return;
    }
    const messageId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const job = await Job.create({
        message_id: messageId,
        source_platform: 'madar',
        channel_username: 'madar:platform',
        channel_title: 'مدار',
        company_name: 'مدار',
        license_number: '',
        company_description: '',
        source_link: '',
        raw_text: summary.trim(),
        published_at: new Date(),
        is_job: true,
        ai_classified_at: new Date(),
        posted_by: 'madar',
        approval_status: 'approved',
        office_verified: false,
        job_info: {
            job_titles: [title.trim()],
            location: location.trim(),
            salary: typeof salary === 'string' && salary.trim() ? salary.trim() : 'يحدد عند المقابلة',
            experience: typeof experience === 'string' && experience.trim() ? experience.trim() : 'غير محدد',
            summary: summary.trim(),
        },
    });
    res.status(201).json({ success: true, data: job });
};

// GET /api/v1/admin/users/lookup?email=... — inspect one account's role/office state
export const lookupUser = async (req: Request, res: Response): Promise<void> => {
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    if (!email) {
        res.status(400).json({ success: false, error: 'email is required.' });
        return;
    }
    const user = await User.findOne({ email })
        .select('email displayName role officeStatus officeName licenseNumber createdAt')
        .exec();
    if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
    }
    res.json({ success: true, data: user });
};

// POST /api/v1/admin/cleanup/pentest — one-off removal of the authorized pentest's probe data
export const cleanupPentestData = async (_req: Request, res: Response): Promise<void> => {
    const emailRegex = /^pentest-seeker-.*@example\.com$/i;
    const users = await User.find({ email: emailRegex }).select('firebaseUid email').exec();
    const uids = users.map((u) => u.firebaseUid);
    const emails = users.map((u) => u.email);

    const apps = await Application.deleteMany({
        $or: [
            { applicantUid: { $in: uids } },
            { applicantEmail: { $in: emails } },
            { job_id: '6b013f7d51e7399b6da6f24d' },
        ],
    });
    const tokens = await FcmToken.deleteMany({ firebaseUid: { $in: uids } });
    const jobs = await Job.deleteMany({ _id: '6b013f7d51e7399b6da6f24d' });
    const userDocs = await User.deleteMany({ email: emailRegex });

    let firebaseUsers = 0;
    if (firebaseAuth) {
        for (const uid of uids) {
            try {
                await firebaseAuth.deleteUser(uid);
                firebaseUsers++;
            } catch {
                // already gone
            }
        }
    }

    res.json({
        success: true,
        data: {
            mongoUsers: userDocs.deletedCount ?? 0,
            firebaseUsers,
            applications: apps.deletedCount ?? 0,
            fcmTokens: tokens.deletedCount ?? 0,
            jobs: jobs.deletedCount ?? 0,
        },
    });
};
