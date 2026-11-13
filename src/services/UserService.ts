import type { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '../models/User.js';
import type { IUser } from '../models/User.js';

/**
 * Find a user by Firebase UID. Create if not exists.
 * Update displayName, photoURL, and email if they have changed.
 */
export const syncUser = async (decodedToken: DecodedIdToken): Promise<IUser> => {
    const { uid, email, name, picture, firebase } = decodedToken;
    const provider = firebase?.sign_in_provider ?? 'email';

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
        user = await User.create({
            firebaseUid: uid,
            email: email ?? '',
            displayName: name ?? '',
            photoURL: picture ?? '',
            provider,
        });
        return user;
    }

    // Update fields if they changed
    let changed = false;
    if (email && user.email !== email) { user.email = email; changed = true; }
    if (name && user.displayName !== name) { user.displayName = name; changed = true; }
    if (picture && user.photoURL !== picture) { user.photoURL = picture; changed = true; }

    if (changed) {
        await user.save();
    }

    return user;
};

/**
 * Find a user by their Firebase UID.
 */
export const getUserByFirebaseUid = async (uid: string): Promise<IUser | null> => {
    return User.findOne({ firebaseUid: uid });
};
