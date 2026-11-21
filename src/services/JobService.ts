import mongoose from 'mongoose';
import { Job, IJob } from '../models/Job.js';

// Types

export interface GetJobsArgs {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    company?: string;
    specialization?: string;
    date_posted?: string;
}

export interface PaginationMetadata {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface JobsResponse {
    jobs: IJob[];
    metadata: PaginationMetadata;
}

export interface OfficeStat {
    name: string;
    jobCount: number;
    description: string;
    license_number: string;
}

export interface LocationStat {
    name: string;
    count: number;
}

export interface SpecializationStat {
    name: string;
    count: number;
}

// Service

export const getJobs = async ({
    page = 1,
    limit = 10,
    search,
    location,
    company,
    specialization,
    date_posted,
}: GetJobsArgs): Promise<JobsResponse> => {
    try {
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pipeline: mongoose.PipelineStage[] = [];

        // 1. Atlas Full-Text Search (must be first if present)
        if (search?.trim()) {
            pipeline.push({
                $search: {
                    index: 'default',
                    text: {
                        query: search.trim(),
                        path: ['job_info.job_titles', 'company_name', 'channel_title'],
                        fuzzy: { maxEdits: 1 },
                    },
                },
            } as unknown as mongoose.PipelineStage);
        }

        // 2. Base filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchStage: Record<string, any> = {
            is_job: true,
            // Office-posted jobs stay hidden until an admin approves them
            $or: [{ posted_by: '' }, { posted_by: { $exists: false } }, { approval_status: 'approved' }],
        };

        if (location) matchStage['job_info.location'] = location;
        if (company) matchStage['company_name'] = company;
        if (specialization) matchStage['job_info.job_titles'] = specialization;

        if (date_posted && date_posted !== 'all') {
            const now = new Date();
            const pastDate = new Date();
            if (date_posted === '24h') pastDate.setDate(now.getDate() - 1);
            else if (date_posted === '7d') pastDate.setDate(now.getDate() - 7);
            else if (date_posted === '30d') pastDate.setDate(now.getDate() - 30);
            matchStage['published_at'] = { $gte: pastDate };
        }

        pipeline.push({ $match: matchStage });

        // 3. Sort (skip if search — Atlas scores handle relevance)
        if (!search?.trim()) {
            pipeline.push({ $sort: { published_at: -1 } });
        }

        // 4. Facet: paginated data + total count in one query
        pipeline.push({
            $facet: {
                data: [
                    { $project: { raw_text: 0 } },
                    { $skip: skip },
                    { $limit: limitNum },
                ],
                totalCount: [{ $count: 'count' }],
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any[] = await Job.aggregate(pipeline).exec();
        const jobs: IJob[] = result[0]?.data ?? [];
        const totalCount: number = result[0]?.totalCount[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCount / limitNum);

        return {
            jobs,
            metadata: {
                page: pageNum,
                limit: limitNum,
                total_count: totalCount,
                total_pages: totalPages,
                has_next_page: pageNum < totalPages,
                has_previous_page: pageNum > 1,
            },
        };
    } catch (error) {
        console.error('JobService.getJobs error:', error);
        return {
            jobs: [],
            metadata: {
                page: 1, limit: 10, total_count: 0,
                total_pages: 0, has_next_page: false, has_previous_page: false,
            },
        };
    }
};

export const getJobById = async (jobId: string): Promise<IJob | null> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
        return await Job.findById(jobId).lean<IJob>().exec();
    } catch (error) {
        console.error('JobService.getJobById error:', error);
        return null;
    }
};

export const getOffices = async (): Promise<OfficeStat[]> => {
    try {
        const result = await Job.aggregate([
            {
                $match: {
                    is_job: true,
                    license_number: { $exists: true, $ne: '' },
                },
            },
            {
                $group: {
                    _id: '$company_name',
                    jobCount: { $sum: 1 },
                    description: { $first: '$company_description' },
                    license_number: { $first: '$license_number' },
                },
            },
            { $sort: { jobCount: -1 } },
        ]).exec();

        return result.map((item) => ({
            name: item._id as string,
            jobCount: item.jobCount as number,
            description: item.description as string,
            license_number: item.license_number as string,
        }));
    } catch (error) {
        console.error('JobService.getOffices error:', error);
        return [];
    }
};

export const getLocations = async (): Promise<LocationStat[]> => {
    try {
        const result = await Job.aggregate([
            { $match: { is_job: true, 'job_info.location': { $exists: true, $ne: '' } } },
            { $group: { _id: '$job_info.location', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]).exec();

        return result.map((item) => ({ name: item._id as string, count: item.count as number }));
    } catch (error) {
        console.error('JobService.getLocations error:', error);
        return [];
    }
};

export const getSpecializations = async (): Promise<{ items: SpecializationStat[]; total: number }> => {
    try {
        const [result, distinctTitles] = await Promise.all([
            Job.aggregate([
                { $match: { is_job: true } },
                { $unwind: '$job_info.job_titles' },
                { $group: { _id: '$job_info.job_titles', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ]).exec(),
            // Real number of distinct specializations across all jobs (no cap)
            Job.distinct('job_info.job_titles', { is_job: true }).exec(),
        ]);

        return {
            items: result.map((item) => ({ name: item._id as string, count: item.count as number })),
            total: distinctTitles.length,
        };
    } catch (error) {
        console.error('JobService.getSpecializations error:', error);
        return { items: [], total: 0 };
    }
};

// Escape user input before using it inside a RegExp (aggregation $match / $regexMatch).
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Autocomplete suggestions for the search box: job titles (specializations) and
 * locations that contain the query, prefix matches first, then by job count.
 */
export const getSuggestions = async (q: string): Promise<{ titles: SpecializationStat[]; locations: LocationStat[] }> => {
    try {
        const contains = new RegExp(escapeRegExp(q), 'i');
        const prefix = `^${escapeRegExp(q)}`;

        const priorityAndSort: mongoose.PipelineStage[] = [
            {
                $addFields: {
                    p: { $cond: [{ $regexMatch: { input: '$_id', regex: prefix, options: 'i' } }, 0, 1] },
                },
            },
            { $sort: { p: 1, count: -1 } },
        ];

        const [titles, locations] = await Promise.all([
            Job.aggregate([
                { $match: { is_job: true } },
                { $unwind: '$job_info.job_titles' },
                { $group: { _id: '$job_info.job_titles', count: { $sum: 1 } } },
                { $match: { _id: contains } },
                ...priorityAndSort,
                { $limit: 6 },
            ]).exec(),
            Job.aggregate([
                { $match: { is_job: true, 'job_info.location': { $exists: true, $ne: '' } } },
                { $group: { _id: '$job_info.location', count: { $sum: 1 } } },
                { $match: { _id: contains } },
                ...priorityAndSort,
                { $limit: 4 },
            ]).exec(),
        ]);

        return {
            titles: titles.map((item) => ({ name: item._id as string, count: item.count as number })),
            locations: locations.map((item) => ({ name: item._id as string, count: item.count as number })),
        };
    } catch (error) {
        console.error('JobService.getSuggestions error:', error);
        return { titles: [], locations: [] };
    }
};

// ---------------------------------------------------------------------------
// Office-posted jobs (مكاتب إلحاق العمالة) and applications
// ---------------------------------------------------------------------------

import { Application } from '../models/Application.js';
import type { IUser } from '../models/User.js';

export interface OfficeJobInput {
    title: string;
    location: string;
    salary?: string;
    experience?: string;
    summary: string;
}

/** Create a job posting owned by an approved office account. */
export const createOfficeJob = async (office: IUser, input: OfficeJobInput, approvalStatus: string = 'pending'): Promise<IJob> => {
    // Synthetic unique id within the office's own channel namespace
    const messageId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

    const job = await Job.create({
        message_id: messageId,
        source_platform: 'madar',
        channel_username: `office:${office.firebaseUid}`,
        channel_title: office.officeName || office.displayName,
        company_name: office.officeName || office.displayName,
        license_number: office.licenseNumber || '',
        company_description: '',
        source_link: '',
        raw_text: input.summary,
        published_at: new Date(),
        is_job: true,
        ai_classified_at: new Date(),
        posted_by: office.firebaseUid,
        approval_status: approvalStatus,
        office_verified: true,
        job_info: {
            job_titles: [input.title.trim()],
            location: input.location.trim(),
            salary: input.salary?.trim() || 'يحدد عند المقابلة',
            experience: input.experience?.trim() || 'غير محدد',
            summary: input.summary.trim(),
        },
    });

    return job;
};

export const getOfficeJobs = async (firebaseUid: string): Promise<IJob[]> => {
    return Job.find({ posted_by: firebaseUid }).sort({ created_at: -1 }).exec();
};

/** Update only the editable content fields of an office's own posting. */
export const updateOfficeJob = async (
    firebaseUid: string,
    jobId: string,
    input: Partial<OfficeJobInput>,
): Promise<IJob | null> => {
    const job = await Job.findOne({ _id: jobId, posted_by: firebaseUid });
    if (!job || !job.job_info) return null;

    if (input.title !== undefined) job.job_info.job_titles = [input.title.trim()];
    if (input.location !== undefined) job.job_info.location = input.location.trim();
    if (input.salary !== undefined) job.job_info.salary = input.salary.trim() || 'يحدد عند المقابلة';
    if (input.experience !== undefined) job.job_info.experience = input.experience.trim() || 'غير محدد';
    if (input.summary !== undefined) {
        job.job_info.summary = input.summary.trim();
        job.raw_text = input.summary.trim();
    }

    // An edited posting goes back through admin review before it is public again
    job.approval_status = 'pending';

    await job.save();
    return job;
};

export const deleteOfficeJob = async (firebaseUid: string, jobId: string): Promise<boolean> => {
    const result = await Job.deleteOne({ _id: jobId, posted_by: firebaseUid });
    await Application.deleteMany({ job_id: jobId });
    return result.deletedCount === 1;
};

export const getOfficeJobApplicants = async (firebaseUid: string, jobId: string) => {
    const job = await Job.findOne({ _id: jobId, posted_by: firebaseUid }).select('_id').exec();
    if (!job) return null;
    return Application.find({ job_id: jobId }).sort({ createdAt: -1 }).exec();
};

export interface ApplicationInput {
    name: string;
    phone: string;
    note?: string;
}

/** A logged-in seeker applies to an office-posted job. One application per job. */
export const applyToJob = async (
    uid: string,
    email: string,
    jobId: string,
    input: ApplicationInput,
): Promise<'ok' | 'duplicate' | 'not_found'> => {
    const job = await Job.findOne({ _id: jobId, posted_by: { $exists: true, $nin: ['', null] }, approval_status: 'approved' }).select('_id').exec();
    if (!job) return 'not_found';

    try {
        await Application.create({
            job_id: jobId,
            applicantUid: uid,
            applicantEmail: email,
            name: input.name.trim(),
            phone: input.phone.trim(),
            note: input.note?.trim() ?? '',
        });
        return 'ok';
    } catch (error: unknown) {
        if ((error as { code?: number })?.code === 11000) return 'duplicate';
        throw error;
    }
};

export const hasApplied = async (uid: string, jobId: string): Promise<boolean> => {
    const existing = await Application.findOne({ job_id: jobId, applicantUid: uid }).select('_id').exec();
    return !!existing;
};
