import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const supabase = getSupabase();

        let query = supabase
            .from('rating_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        // If student, only show their own
        if (session.role === 'STUDENT') {
            const { data: myStudent } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', session.userId)
                .maybeSingle();

            if (myStudent) {
                query = query.eq('student_id', myStudent.id);
            }
        }

        // If faculty and no specific student, we show the global feed (all logs), as per the UI design.

        const { data: logs, error } = await query;

        if (error) {
            console.error('History error:', error);
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
        }

        // --- Fetch Critical Incidents explicitly to merge into history ---
        let incidentQuery = supabase
            .from('critical_incidents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (studentId) {
            incidentQuery = incidentQuery.eq('student_id', studentId);
        }

        if (session.role === 'STUDENT') {
            const { data: myStudent } = await supabase.from('students').select('id').eq('user_id', session.userId).maybeSingle();
            if (myStudent) incidentQuery = incidentQuery.eq('student_id', myStudent.id);
        }

        // If faculty and no specific student, we show the global feed (all incidents)

        const { data: incidents } = await incidentQuery;
        const allItems: Record<string, unknown>[] = [...(logs || []), ...(incidents || [])].sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()).slice(0, 50);

        // Get student and faculty names
        const studentIds = [...new Set(allItems.map(l => l.student_id as string))].filter(Boolean);
        const facultyIds = [...new Set(allItems.map(l => l.faculty_id as string))].filter(Boolean);

        const studentNameMap: Record<string, { name: string; rollNumber: string }> = {};
        const facultyNameMap: Record<string, string> = {};

        if (studentIds.length > 0) {
            const { data: students } = await supabase.from('students').select('id, roll_number, user_id').in('id', studentIds);
            if (students) {
                const uIds = students.map((s: Record<string, unknown>) => s.user_id as string);
                const { data: users } = await supabase.from('users').select('id, name').in('id', uIds);
                for (const s of students) {
                    const u = (users || []).find((u: Record<string, unknown>) => u.id === (s as Record<string, unknown>).user_id);
                    studentNameMap[(s as Record<string, unknown>).id as string] = {
                        name: u ? (u as Record<string, unknown>).name as string : 'Unknown',
                        rollNumber: (s as Record<string, unknown>).roll_number as string,
                    };
                }
            }
        }

        if (facultyIds.length > 0) {
            const { data: faculties } = await supabase.from('faculty').select('id, user_id').in('id', facultyIds);
            if (faculties) {
                const uIds = faculties.map((f: Record<string, unknown>) => f.user_id as string);
                const { data: users } = await supabase.from('users').select('id, name').in('id', uIds);
                for (const f of faculties) {
                    const u = (users || []).find((u: Record<string, unknown>) => u.id === (f as Record<string, unknown>).user_id);
                    facultyNameMap[(f as Record<string, unknown>).id as string] = u ? (u as Record<string, unknown>).name as string : 'Unknown';
                }
            }
        }

        const transformed = allItems.map(item => {
            const stud = studentNameMap[item.student_id as string] || { name: 'Unknown', rollNumber: '' };
            
            // Determine if it's a rating log or an incident based on presence of 'type' or 'severity'
            if (item.severity) {
                // It's a critical incident
                return {
                    id: item.id,
                    pointChange: item.type === 'FINE' && item.fine_amount ? -Math.abs(Number(item.fine_amount)) : 0,
                    reason: `[${item.status}] ${item.severity} INQUIRY: ${item.title}${item.fine_amount ? ` (Fine: ₹${item.fine_amount})` : ''}`,
                    category: 'CRITICAL',
                    createdAt: item.created_at,
                    student: {
                        rollNumber: stud.rollNumber,
                        user: { name: stud.name },
                    },
                    faculty: {
                        user: { name: facultyNameMap[item.faculty_id as string] || 'Unknown' },
                    },
                };
            }
            
            return {
                id: item.id,
                pointChange: item.point_change,
                reason: item.reason,
                category: item.category,
                createdAt: item.created_at,
                student: {
                    rollNumber: stud.rollNumber,
                    user: { name: stud.name },
                },
                faculty: {
                    user: { name: facultyNameMap[item.faculty_id as string] || 'Unknown' },
                },
            };
        });

        return NextResponse.json({ logs: transformed });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
