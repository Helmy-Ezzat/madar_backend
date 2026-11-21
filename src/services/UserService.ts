import type { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '../models/User.js';
import type { IUser } from '../models/User.js';

/**
 * Find a user by Firebase UID. Create if not exists.
 * Update displayName, photoURL, and email if they have changed.
 */
export interface SyncProfile {
    role?: string;
    officeName?: string;
    licenseNumber?: string;
}

export const syncUser = async (decodedToken: DecodedIdToken, profile?: SyncProfile): Promise<IUser> => {
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
    }

    // A plain user can register as a labor-recruitment office (مكتب إلحاق عمالة);
    // the account stays pending until an admin approves it. Existing office/admin
    // roles are never overwritten here, and nobody can self-assign admin.
    if (profile?.role === 'office' && user.role === 'user') {
        user.role = 'office';
        user.officeStatus = 'pending';
        user.officeName = profile.officeName?.trim() ?? '';
        user.licenseNumber = profile.licenseNumber?.trim() ?? '';
        await user.save();
        return user;
    }

    if (user.role === 'office') {
        let officeChanged = false;
        if (profile?.officeName !== undefined && profile.officeName.trim() && user.officeName !== profile.officeName.trim()) {
            user.officeName = profile.officeName.trim();
            officeChanged = true;
        }
        if (profile?.licenseNumber !== undefined && profile.licenseNumber.trim() && user.licenseNumber !== profile.licenseNumber.trim()) {
            user.licenseNumber = profile.licenseNumber.trim();
            officeChanged = true;
        }
        if (officeChanged) await user.save();
    }

    if (!user.officeStatus && user.role !== 'office') {
        // nothing to do — plain seeker account
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
