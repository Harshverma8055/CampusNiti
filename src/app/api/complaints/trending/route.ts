import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// GET /api/complaints/trending — highest priority_score public complaints
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20);

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('complaints')
            .select(`
                id, title, category, zone, severity, priority,
                priority_score, status, is_emergency, upvote_count,
                comment_count, sla_breached, created_at,
                complaint_media(public_url, is_before, media_type)
            `)
            .in('status', ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'])
            .order('priority_score', { ascending: false })
            .limit(limit);

        if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

        const trending = (data ?? []).map((r: Record<string, unknown>) => {
            const media = (r.complaint_media as Array<Record<string, unknown>>) ?? [];
            const thumb = media.find(m => m.is_before && m.media_type === 'IMAGE');
            return { ...r, complaint_media: undefined, thumbnail: thumb?.public_url ?? null };
        });

        return NextResponse.json({ trending });
    } catch (err) {
        console.error('Trending error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
