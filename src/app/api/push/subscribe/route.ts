import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// POST /api/push/subscribe  — save a new push subscription
// DELETE /api/push/subscribe — remove a push subscription
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { endpoint, keys } = await request.json();
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Upsert — no duplicate endpoints per user
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: session.userId,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                },
                { onConflict: 'user_id,endpoint' }
            );

        if (error) {
            console.error('Push subscribe error:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Push subscribe exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { endpoint } = await request.json();
        const supabase = getSupabase();

        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', session.userId)
            .eq('endpoint', endpoint);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
