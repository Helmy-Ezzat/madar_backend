import { Request, Response } from 'express';
import { User } from '../../models/User.js';

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
