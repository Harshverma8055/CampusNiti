import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.userId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        const unreadCount = (notifications || []).filter((n: Record<string, unknown>) => !n.is_read).length;

        return NextResponse.json({
            notifications: (notifications || []).map((n: Record<string, unknown>) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                isRead: n.is_read,
                metadata: n.metadata,
                createdAt: n.created_at,
            })),
            unreadCount,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
