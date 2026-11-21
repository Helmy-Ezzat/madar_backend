import { Types } from 'mongoose';
import { SavedJob } from '../models/SavedJob.js';
import { Job } from '../models/Job.js';

export const SavedJobService = {
    /**
     * Returns the user's saved jobs, newest save first, with the job documents populated.
     * Entries whose job was deleted from the jobs collection are skipped and cleaned up.
     */
    async listSavedJobs(firebaseUid: string) {
        const saves = await SavedJob.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .populate('job')
            .lean();

        const orphanedIds = saves.filter((s) => !s.job).map((s) => s._id);
        if (orphanedIds.length > 0) {
            await SavedJob.deleteMany({ _id: { $in: orphanedIds } });
        }

        return saves.filter((s) => s.job);
    },

    /**
     * Toggles a saved job for the user. Returns { saved: true } when the job
     * is now saved, { saved: false } when it was removed.
     * Throws SavedJobService.JobNotFoundError when the job does not exist.
     */
    async toggleSavedJob(firebaseUid: string, jobId: string) {
        if (!Types.ObjectId.isValid(jobId)) {
            throw new SavedJobNotFoundError();
        }

        const jobExists = await Job.exists({ _id: jobId });
        if (!jobExists) {
            throw new SavedJobNotFoundError();
        }

        const removed = await SavedJob.findOneAndDelete({ firebaseUid, job: jobId });
        if (removed) {
            return { saved: false };
        }

        await SavedJob.create({ firebaseUid, job: jobId });
        return { saved: true };
    },
};

export class SavedJobNotFoundError extends Error {
    constructor() {
        super('Job not found.');
        this.name = 'SavedJobNotFoundError';
    }
}
