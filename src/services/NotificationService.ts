import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { FcmToken } from '../models/FcmToken.js';
import { SavedSearch, type ISavedSearch } from '../models/SavedSearch.js';
import type { IJob } from '../models/Job.js';

let messaging: Messaging | null = null;

/** Lazy-init: the Firebase app is initialized in config/firebase.ts on boot. */
function getFirebaseMessaging(): Messaging | null {
    if (messaging) return messaging;
    try {
        messaging = getMessaging();
        return messaging;
    } catch {
        console.warn('⚠️  Firebase Messaging not available. Push notifications disabled.');
        return null;
    }
}

export const NotificationService = {
    async registerToken(firebaseUid: string, token: string) {
        await FcmToken.findOneAndUpdate(
            { token },
            { $set: { firebaseUid, token } },
            { upsert: true, new: true },
        );
        return { registered: true };
    },

    async unregisterToken(firebaseUid: string, token: string) {
        await FcmToken.deleteOne({ firebaseUid, token });
        return { registered: false };
    },

    /** Sends a demo notification to every device registered for this user. */
    async sendTestToUser(firebaseUid: string) {
        const fcm = getFirebaseMessaging();
        if (!fcm) return { sent: 0, reason: 'messaging-unavailable' };
        const tokens = await FcmToken.find({ firebaseUid }).lean().exec();
        if (tokens.length === 0) return { sent: 0, reason: 'no-tokens', devices: 0 };
        // Data-only payload: the service worker renders the notification itself,
        // which behaves identically on desktop Chrome and Android (notification-key
        // payloads take a different SDK path that silently no-ops on some desktops).
        const res = await fcm.sendEachForMulticast({
            tokens: tokens.map((t) => t.token),
            data: {
                title: 'إشعار تجريبي من مدار 🎉',
                body: 'كده الإشعارات شغالة! هيوصلك تنبيه أول ما تنزل وظيفة مطابقة لبحثك.',
                link: '/',
            },
            webpush: {
                fcmOptions: { link: 'https://madar-jobs.vercel.app/' },
            },
        });
        // Clean dead tokens
        const dead: string[] = [];
        res.responses.forEach((r, i) => {
            const code = r.error?.code ?? '';
            if (!r.success && (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token'))) {
                dead.push(tokens[i].token);
            }
        });
        if (dead.length) await FcmToken.deleteMany({ token: { $in: dead } });
        // Surface the first send error code so the test button can show it while debugging
        const firstError = res.responses.find((r) => !r.success)?.error?.code ?? null;
        // Debug aid: when each registered token was last (re)registered
        const tokenInfo = tokens.map((t) => ({ createdAt: t.createdAt, updatedAt: t.updatedAt }));
        return { sent: res.successCount, failed: res.failureCount, devices: tokens.length, firstError, tokenInfo };
    },
};

/**
 * A saved search matches a job with the same semantics as the /jobs filters:
 * - specialization: exact match inside job_info.job_titles
 * - country: exact match on job_info.location
 * - query: case-insensitive substring over titles + company name
 * Empty criteria match everything.
 */
function matchesSearch(search: { firebaseUid: string; country: string; specialization: string; query: string }, job: IJob): boolean {
    const info = job.job_info;
    if (!info) return false;

    if (search.specialization && !(info.job_titles ?? []).includes(search.specialization)) {
        return false;
    }
    if (search.country && info.location !== search.country) {
        return false;
    }
    if (search.query) {
        const haystack = `${(info.job_titles ?? []).join(' ')} ${job.company_name}`.toLowerCase();
        if (!haystack.includes(search.query.toLowerCase())) {
            return false;
        }
    }
    return true;
}

/**
 * Called by the scraper after inserting a genuinely NEW job.
 * Finds matching saved searches and pushes an FCM notification to each
 * user's registered devices. Never throws — notification failures must not
 * break the scraping cycle.
 */
export async function notifyNewJob(job: IJob): Promise<void> {
    try {
        const fcm = getFirebaseMessaging();
        if (!fcm) return;

        const searches = await SavedSearch.find({}).lean();
        const matchedUids = [...new Set(
            searches.filter((s) => matchesSearch(s, job)).map((s) => s.firebaseUid),
        )];
        if (matchedUids.length === 0) return;

        const tokens = await FcmToken.find({ firebaseUid: { $in: matchedUids } }).lean();
        if (tokens.length === 0) return;

        const title = job.job_info?.job_titles?.[0] ?? 'وظيفة جديدة';
        const response = await fcm.sendEachForMulticast({
            tokens: tokens.map((t) => t.token),
            data: {
                title: 'وظيفة جديدة مطابقة لبحثك',
                body: `${title} — ${job.company_name}`,
                jobId: String(job._id),
                link: `/jobs?jobId=${String(job._id)}`,
            },
            webpush: {
                fcmOptions: { link: `https://madar-jobs.vercel.app/jobs?jobId=${String(job._id)}` },
            },
        });

        // Clean up dead tokens
        const deadTokens: string[] = [];
        response.responses.forEach((r, i) => {
            const code = r.error?.code ?? '';
            if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
            ) {
                deadTokens.push(tokens[i].token);
            }
        });
        if (deadTokens.length > 0) {
            await FcmToken.deleteMany({ token: { $in: deadTokens } });
        }

        console.log(`🔔 New-job notifications sent: ${response.successCount} ok, ${response.failureCount} failed`);
    } catch (error) {
        console.error('❌ notifyNewJob error:', error);
    }
}
