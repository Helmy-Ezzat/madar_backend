import mongoose, { Schema, Document, Model } from 'mongoose';

// Sub-document types

export interface IJobInfo {
    job_titles: string[];
    location: string;
    salary: string;
    experience: string;
    summary: string;
}

// Main document interface

export interface IJob extends Document {
    message_id: number;
    source_platform: string;
    channel_username: string;
    channel_title: string;
    company_name: string;
    license_number: string;
    company_description: string;
    source_link: string;
    raw_text: string;
    published_at: Date;
    created_at: Date;
    is_job: boolean;
    job_info: IJobInfo | null;
    /** Set only after a successful AI parse (job or not). Missing means retry. */
    ai_classified_at?: Date;
    /** Firebase UID of the office account that posted this job (empty for scraped jobs). */
    posted_by?: string;
    approval_status?: string;
    /** True when posted by an approved labor-recruitment office (إلحاق عمالة معتمد). */
    office_verified?: boolean;
}

// Schema

const JobInfoSchema = new Schema<IJobInfo>(
    {
        job_titles: { type: [String], default: [] },
        location: { type: String, default: '' },
        salary: { type: String, default: 'يحدد عند المقابلة' },
        experience: { type: String, default: 'غير محدد' },
        summary: { type: String, default: '' },
    },
    { _id: false }
);

const JobSchema = new Schema<IJob>(
    {
        message_id: { type: Number, required: true },
        source_platform: { type: String, default: 'telegram' },
        channel_username: { type: String, required: true, index: true },
        channel_title: { type: String, default: '' },
        company_name: { type: String, default: '' },
        license_number: { type: String, default: '' },
        company_description: { type: String, default: '' },
        source_link: { type: String, default: '' },
        raw_text: { type: String, default: '' },
        published_at: { type: Date, required: true },
        created_at: { type: Date, default: Date.now },
        is_job: { type: Boolean, default: false, index: true },
        job_info: { type: JobInfoSchema, default: null },
        ai_classified_at: { type: Date, required: false },
        posted_by: { type: String, default: '', index: true },
        approval_status: { type: String, default: '' },
        office_verified: { type: Boolean, default: false },
    },
    {
        // Map to the existing collection — no renaming needed
        collection: 'jobs_collection',
    }
);

// Compound index for deduplication (same as Python scraper logic)
JobSchema.index({ message_id: 1, channel_username: 1 }, { unique: true });

// Model

export const Job: Model<IJob> = mongoose.model<IJob>('Job', JobSchema);
