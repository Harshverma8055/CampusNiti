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

        // Department-wise stats
        const { data: students } = await supabase.from('students').select('department, year, rating');
        
        const deptStats: Record<string, { count: number; totalRating: number }> = {};
        const yearStats: Record<number, { count: number; totalRating: number }> = {};

        students?.forEach((s: { department: string; year: number; rating: number }) => {
            // Department
            if (!deptStats[s.department]) deptStats[s.department] = { count: 0, totalRating: 0 };
            deptStats[s.department].count++;
            deptStats[s.department].totalRating += s.rating;

            // Year
            if (!yearStats[s.year]) yearStats[s.year] = { count: 0, totalRating: 0 };
            yearStats[s.year].count++;
            yearStats[s.year].totalRating += s.rating;
        });

        // Top & Bottom performers
        const { data: topStudents } = await supabase
            .from('students')
            .select('id, rating, roll_number, department, user:users(name)')
            .order('rating', { ascending: false })
            .limit(5);

        const { data: bottomStudents } = await supabase
            .from('students')
            .select('id, rating, roll_number, department, user:users(name)')
            .order('rating', { ascending: true })
            .limit(5);

        // Incident trends (count per month)
        const { data: incidents } = await supabase
            .from('critical_incidents')
            .select('created_at')
            .order('created_at', { ascending: true });

        const incidentTrends: Record<string, number> = {};
        incidents?.forEach((i: { created_at: string }) => {
            const month = new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            incidentTrends[month] = (incidentTrends[month] || 0) + 1;
        });

        // Faculty activity
        const { data: ratingLogs } = await supabase
            .from('rating_logs')
            .select('faculty_id, faculty:faculty(user:users(name))');

        const facultyActivity: Record<string, { name: string; count: number }> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ratingLogs?.forEach((l: any) => {
            const fid = l.faculty_id;
            const fname = l.faculty?.user?.name || (Array.isArray(l.faculty) ? l.faculty[0]?.user?.name || (Array.isArray(l.faculty[0]?.user) ? l.faculty[0]?.user[0]?.name : 'Unknown') : 'Unknown');
            if (!facultyActivity[fid]) {
                facultyActivity[fid] = { name: fname, count: 0 };
            }
            facultyActivity[fid].count++;
        });

        return NextResponse.json({
            departmentStats: Object.entries(deptStats).map(([name, data]) => ({
                name,
                count: data.count,
                avgRating: Math.round(data.totalRating / data.count),
            })),
            yearStats: Object.entries(yearStats).map(([year, data]) => ({
                year: parseInt(year),
                count: data.count,
                avgRating: Math.round(data.totalRating / data.count),
            })).sort((a, b) => a.year - b.year),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            topPerformers: (topStudents || []).map((s: any) => ({
                id: s.id, name: s.user?.name || (Array.isArray(s.user) ? s.user[0]?.name : 'Unknown'), rollNumber: s.roll_number, department: s.department, rating: s.rating,
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bottomPerformers: (bottomStudents || []).map((s: any) => ({
                id: s.id, name: s.user?.name || (Array.isArray(s.user) ? s.user[0]?.name : 'Unknown'), rollNumber: s.roll_number, department: s.department, rating: s.rating,
            })),
            incidentTrends: Object.entries(incidentTrends).map(([month, count]) => ({ month, count })),
            facultyActivity: Object.values(facultyActivity).sort((a, b) => b.count - a.count).slice(0, 10),
        });
    } catch (err) {
        console.error('Admin analytics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
