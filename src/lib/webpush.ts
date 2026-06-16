import webpush from 'web-push';
import { getSupabase } from './supabase';

// Configure VAPID details once if keys are available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@discipline.app',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('VAPID keys are missing. Push notifications will be disabled.');
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
}

/**
 * Send a push notification to a single user by their user_id.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
    const supabase = getSupabase();

    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) return;

    const message = JSON.stringify(payload);

    await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                // Add a strict 3-second timeout to prevent hanging the Vercel function
                const pushPromise = webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    message
                );
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Push timeout')), 3000)
                );
                
                await Promise.race([pushPromise, timeoutPromise]);
            } catch (err: unknown) {
                // If subscription expired/invalid, remove it
                const webPushErr = err as { statusCode?: number };
                if (webPushErr?.statusCode === 410 || webPushErr?.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                }
            }
        })
    );
}

/**
 * Send push to multiple users by their user_id list.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
    await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}
