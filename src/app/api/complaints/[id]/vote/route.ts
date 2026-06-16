import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { sendPushToUser } from '@/lib/webpush';
import { ComplaintNotifications } from '@/lib/complaint-notifications';

// POST /api/complaints/[id]/vote — atomic upvote toggle
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Student access required' }, { status: 403 });
        }

        const { id: complaintId } = await params;
        const supabase = getSupabase();

        // Get student record
        const { data: student } = await supabase
            .from('students').select('id').eq('user_id', session.userId).maybeSingle();
        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // Verify complaint exists and is public
        const { data: complaint } = await supabase
            .from('complaints')
            .select('id, status, upvote_count, reporter_student_id, title')
            .eq('id', complaintId)
            .maybeSingle();
        if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

        const publicStatuses = ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
        if (!publicStatuses.includes(complaint.status)) {
            return NextResponse.json({ error: 'Cannot vote on this complaint' }, { status: 400 });
        }

        // Use atomic RPC to toggle vote
        const { data, error } = await supabase.rpc('toggle_complaint_upvote', {
            p_complaint_id: complaintId,
            p_student_id: student.id,
        });

        if (error) {
            console.error('Upvote RPC error:', error);
            return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
        }

        const result = data as { voted: boolean; upvote_count: number };

        // Notify reporter when complaint hits trending milestones (10, 25, 50 votes)
        const milestones = [10, 25, 50, 100];
        if (result.voted && result.upvote_count !== undefined &&
            milestones.includes(result.upvote_count) &&
            complaint.reporter_student_id) {
            const { data: reporter } = await supabase
                .from('students').select('user_id').eq('id', complaint.reporter_student_id).maybeSingle();
            if (reporter?.user_id) {
                sendPushToUser(reporter.user_id, ComplaintNotifications.trending(complaintId)).catch(console.warn);
            }
        }

        return NextResponse.json({
            success: true,
            voted: result.voted,
            upvote_count: result.upvote_count,
        });
    } catch (err) {
        console.error('POST /api/complaints/[id]/vote error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
