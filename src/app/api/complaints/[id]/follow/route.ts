import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// POST /api/complaints/[id]/follow — toggle follow/unfollow
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id: complaintId } = await params;
        const supabase = getSupabase();

        const { data: existing } = await supabase
            .from('complaint_followers')
            .select('complaint_id')
            .eq('complaint_id', complaintId)
            .eq('user_id', session.userId)
            .maybeSingle();

        if (existing) {
            await supabase.from('complaint_followers')
                .delete()
                .eq('complaint_id', complaintId)
                .eq('user_id', session.userId);
            return NextResponse.json({ following: false });
        } else {
            await supabase.from('complaint_followers')
                .insert({ complaint_id: complaintId, user_id: session.userId });
            return NextResponse.json({ following: true });
        }
    } catch (err) {
        console.error('Follow toggle error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
