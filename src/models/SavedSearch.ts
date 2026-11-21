import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedSearch extends Document {
    firebaseUid: string;
    country: string;
    specialization: string;
    query: string;
    createdAt: Date;
    updatedAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
    {
        firebaseUid: { type: String, required: true, index: true },
        country: { type: String, default: '' },
        specialization: { type: String, default: '' },
        query: { type: String, default: '' },
    },
    {
        timestamps: true,
        collection: 'saved_searches',
    },
);

// Same user can't save the exact same search twice
SavedSearchSchema.index(
    { firebaseUid: 1, country: 1, specialization: 1, query: 1 },
    { unique: true },
);

export const SavedSearch: Model<ISavedSearch> = mongoose.model<ISavedSearch>('SavedSearch', SavedSearchSchema);
