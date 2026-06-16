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

        const { data: students, error } = await supabase
            .from('students')
            .select('id, roll_number, department, rating, user_id, critical_incidents(status)')
            .order('rating', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
        }

        // Get all user names
        const userIds = (students || []).map((s: Record<string, unknown>) => s.user_id as string);
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);

        const userMap: Record<string, string> = {};
        (users || []).forEach((u: Record<string, unknown>) => {
            userMap[u.id as string] = u.name as string;
        });

        const rankings = (students || []).map((s: Record<string, unknown>, index: number) => {
            const hasPendingInquiry = ((s.critical_incidents as Record<string, unknown>[]) || []).some((ci: Record<string, unknown>) => ci.status === 'PENDING');
            return {
                id: s.id,
                name: userMap[s.user_id as string] || 'Unknown',
                rollNumber: s.roll_number,
                department: s.department,
                rating: s.rating,
                rank: index + 1,
                hasPendingInquiry,
            };
        });

        const response = NextResponse.json({ rankings });
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return response;
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
