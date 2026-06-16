import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const feedbackSchema = z.object({
    rating:           z.number().int().min(1).max(5),
    comment:          z.string().max(500).optional(),
    response_time_ok: z.boolean().optional(),
    quality_ok:       z.boolean().optional(),
});

// POST /api/complaints/[id]/feedback
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Student access required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = feedbackSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
        }

        const supabase = getSupabase();

        // Verify complaint is resolved
        const { data: complaint } = await supabase
            .from('complaints').select('status, reporter_student_id').eq('id', id).maybeSingle();
        if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
        if (complaint.status !== 'RESOLVED') {
            return NextResponse.json({ error: 'Feedback can only be submitted for resolved complaints' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('complaint_feedback')
            .upsert({
                complaint_id:     id,
                submitted_by_id:  session.userId,
                rating:           parsed.data.rating,
                comment:          parsed.data.comment,
                response_time_ok: parsed.data.response_time_ok,
                quality_ok:       parsed.data.quality_ok,
            }, { onConflict: 'complaint_id,submitted_by_id' })
            .select()
            .single();

        if (error) {
            console.error('Feedback insert error:', error);
            return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
        }

        return NextResponse.json({ success: true, feedback: data }, { status: 201 });
    } catch (err) {
        console.error('POST /api/complaints/[id]/feedback error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/complaints/[id]/feedback
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('complaint_feedback')
            .select('*, submitted_by:users!complaint_feedback_submitted_by_id_fkey(name)')
            .eq('complaint_id', id);

        if (error) return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });

        const avgRating = data?.length
            ? data.reduce((s, f) => s + f.rating, 0) / data.length
            : null;

        return NextResponse.json({ feedback: data ?? [], avgRating });
    } catch (err) {
        console.error('GET /api/complaints/[id]/feedback error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
