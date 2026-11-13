import { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { firebaseAuth } from '../config/firebase.js';

// Augment Express Request to include the decoded Firebase token
declare global {
    namespace Express {
        interface Request {
            user?: DecodedIdToken;
        }
    }
}

/**
 * Requires a valid Firebase ID token in the Authorization header.
 * Attaches the decoded token to `req.user`. Returns 401 if missing/invalid.
 */
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    if (!firebaseAuth) {
        res.status(503).json({ success: false, error: 'Firebase Auth is not configured on the server.' });
        return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing or invalid Authorization header.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = await firebaseAuth.verifyIdToken(token);
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};

/**
 * Same as requireAuth but does NOT reject unauthenticated requests.
 * Sets `req.user` to the decoded token if present, or `undefined` otherwise.
 */
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    if (!firebaseAuth) {
        req.user = undefined;
        next();
        return;
    }

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = await firebaseAuth.verifyIdToken(token);
        } catch {
            // Token invalid — treat as unauthenticated
            req.user = undefined;
        }
    }

    next();
};
