import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISavedJob extends Document {
    firebaseUid: string;
    job: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
    {
        firebaseUid: { type: String, required: true, index: true },
        job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    },
    {
        timestamps: true,
        collection: 'saved_jobs',
    },
);

// One save per user per job
SavedJobSchema.index({ firebaseUid: 1, job: 1 }, { unique: true });

export const SavedJob: Model<ISavedJob> = mongoose.model<ISavedJob>('SavedJob', SavedJobSchema);
