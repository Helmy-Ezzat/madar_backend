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
        const matchStage: Record<string, any> = { is_job: true };

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
                    _id: '$license_number', // Group by license number to merge same companies
                    jobCount: { $sum: 1 },
                    name: { $first: '$company_name' }, // Take first company name
                    description: { $first: '$company_description' }, // Take first description
                },
            },
            { $sort: { jobCount: -1 } },
        ]).exec();

        return result.map((item) => ({
            name: item.name as string,
            jobCount: item.jobCount as number,
            description: item.description as string,
            license_number: item._id as string,
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

export const getSpecializations = async (): Promise<SpecializationStat[]> => {
    try {
        const result = await Job.aggregate([
            { $match: { is_job: true } },
            { $unwind: '$job_info.job_titles' },
            { $group: { _id: '$job_info.job_titles', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]).exec();

        return result.map((item) => ({ name: item._id as string, count: item.count as number }));
    } catch (error) {
        console.error('JobService.getSpecializations error:', error);
        return [];
    }
};
