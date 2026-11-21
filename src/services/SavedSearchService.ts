import { SavedSearch } from '../models/SavedSearch.js';

const MAX_SAVED_SEARCHES_PER_USER = 10;

export class SavedSearchLimitError extends Error {
    constructor() {
        super('Saved searches limit reached.');
        this.name = 'SavedSearchLimitError';
    }
}

export const SavedSearchService = {
    async list(firebaseUid: string) {
        return SavedSearch.find({ firebaseUid }).sort({ createdAt: -1 }).lean();
    },

    async create(firebaseUid: string, data: { country?: string; specialization?: string; query?: string }) {
        const count = await SavedSearch.countDocuments({ firebaseUid });
        if (count >= MAX_SAVED_SEARCHES_PER_USER) {
            throw new SavedSearchLimitError();
        }
        const search = await SavedSearch.create({
            firebaseUid,
            country: data.country ?? '',
            specialization: data.specialization ?? '',
            query: data.query ?? '',
        });
        return search;
    },

    async remove(firebaseUid: string, id: string) {
        const removed = await SavedSearch.findOneAndDelete({ _id: id, firebaseUid });
        return { deleted: !!removed };
    },
};
