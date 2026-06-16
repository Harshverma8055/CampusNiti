import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const commentSchema = z.object({
    content: z.string().min(1).max(1000),
});

// GET /api/complaints/[id]/comments
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const supabase = getSupabase();

        const { data: comments, error } = await supabase
            .from('complaint_comments')
            .select(`
                id, content, is_official, is_deleted, created_at,
                author:users!complaint_comments_author_id_fkey(id, name, role)
            `)
            .eq('complaint_id', id)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });

        const filtered = (comments ?? []).map((c: Record<string, unknown>) => ({
            ...c,
            content: c.is_deleted ? '[This comment was removed]' : c.content,
        }));

        return NextResponse.json({ comments: filtered });
    } catch (err) {
        console.error('GET comments error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/complaints/[id]/comments
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = commentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Verify complaint is public
        const { data: complaint } = await supabase
            .from('complaints').select('status').eq('id', id).maybeSingle();
        if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

        const allowedStatuses = ['PENDING_REVIEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
        if (!allowedStatuses.includes(complaint.status) && session.role === 'STUDENT') {
            return NextResponse.json({ error: 'Commenting not allowed on this complaint' }, { status: 400 });
        }

        const isOfficial = ['ADMIN', 'MAINTENANCE', 'FACULTY'].includes(session.role);

        const { data: comment, error } = await supabase
            .from('complaint_comments')
            .insert({
                complaint_id: id,
                author_id: session.userId,
                content: parsed.data.content,
                is_official: isOfficial,
            })
            .select()
            .single();

        if (error) {
            console.error('Comment insert error:', error);
            return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
        }

        // Increment comment count
        try {
            const { data: current } = await supabase
                .from('complaints')
                .select('comment_count')
                .eq('id', id)
                .single();
            await supabase
                .from('complaints')
                .update({ comment_count: (current?.comment_count ?? 0) + 1 })
                .eq('id', id);
        } catch {
            // Non-critical: comment was still created successfully
            console.warn('Failed to increment comment count for', id);
        }

        return NextResponse.json({ success: true, comment }, { status: 201 });
    } catch (err) {
        console.error('POST comment error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
