import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApplication extends Document {
    job_id: mongoose.Types.ObjectId;
    applicantUid: string;
    applicantEmail: string;
    name: string;
    phone: string;
    note: string;
    createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
    {
        job_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
        applicantUid: { type: String, required: true },
        applicantEmail: { type: String, default: '' },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        note: { type: String, default: '' },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: 'applications',
    },
);

// One application per seeker per job
ApplicationSchema.index({ job_id: 1, applicantUid: 1 }, { unique: true });

export const Application: Model<IApplication> = mongoose.model<IApplication>('Application', ApplicationSchema);
