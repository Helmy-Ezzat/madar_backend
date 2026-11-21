import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFcmToken extends Document {
    firebaseUid: string;
    token: string;
    createdAt: Date;
    updatedAt: Date;
}

const FcmTokenSchema = new Schema<IFcmToken>(
    {
        firebaseUid: { type: String, required: true, index: true },
        token: { type: String, required: true, unique: true },
    },
    {
        timestamps: true,
        collection: 'fcm_tokens',
    },
);

export const FcmToken: Model<IFcmToken> = mongoose.model<IFcmToken>('FcmToken', FcmTokenSchema);
