import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
let firebaseApp: App | null = null;
let firebaseAuth: Auth | null = null;

if (!base64) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Firebase Auth will not work.');
} else {
    try {
        const serviceAccount = JSON.parse(
            Buffer.from(base64, 'base64').toString('utf-8'),
        );
        firebaseApp = getApps().length === 0
            ? initializeApp({ credential: cert(serviceAccount) })
            : getApps()[0];
        firebaseAuth = getAuth(firebaseApp);
        console.log('✅ Firebase Admin initialized.');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
    }
}

export { firebaseAuth };

