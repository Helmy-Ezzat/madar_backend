import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName: string;
    photoURL: string;
    provider: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        firebaseUid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        displayName: { type: String, default: '' },
        photoURL: { type: String, default: '' },
        provider: { type: String, default: 'email' },
        role: { type: String, default: 'user' },
    },
    {
        timestamps: true,
        collection: 'users',
    },
);

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
