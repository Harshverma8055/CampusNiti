import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();

        // Get counts
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: facultyCount } = await supabase.from('faculty').select('*', { count: 'exact', head: true });
        const { count: pendingIncidents } = await supabase.from('critical_incidents').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');

        // All students for avg rating and low rating
        const { data: allStudents } = await supabase.from('students').select('rating');
        const avgRating = allStudents && allStudents.length > 0
            ? Math.round(allStudents.reduce((sum: number, s: { rating: number }) => sum + s.rating, 0) / allStudents.length)
            : 0;
        const lowRatingCount = allStudents ? allStudents.filter((s: { rating: number }) => s.rating < 70).length : 0;

        // Recent rating logs
        const { data: recentLogs } = await supabase
            .from('rating_logs')
            .select('*, student:students(roll_number, user:users(name)), faculty:faculty(user:users(name))')
            .order('created_at', { ascending: false })
            .limit(10);

        // Department breakdown
        const { data: deptData } = await supabase.from('students').select('department');
        const deptCounts: Record<string, number> = {};
        deptData?.forEach((s: { department: string }) => {
            deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
        });

        return NextResponse.json({
            stats: {
                totalStudents: studentCount || 0,
                totalFaculty: facultyCount || 0,
                pendingIncidents: pendingIncidents || 0,
                avgRating,
                lowRatingCount,
            },
            recentLogs: recentLogs?.map(log => ({
                id: log.id,
                pointChange: log.point_change,
                reason: log.reason,
                category: log.category,
                createdAt: log.created_at,
                studentName: log.student?.user?.name || 'Unknown',
                studentRoll: log.student?.roll_number || '',
                facultyName: log.faculty?.user?.name || 'Unknown',
            })) || [],
            departmentBreakdown: Object.entries(deptCounts).map(([name, count]) => ({ name, count })),
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
