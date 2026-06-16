import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationIds } = body;
        const supabase = getSupabase();

        if (notificationIds && Array.isArray(notificationIds)) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', notificationIds)
                .eq('user_id', session.userId);
        } else {
            // Mark all as read
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', session.userId)
                .eq('is_read', false);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
