import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = getSupabase();

        // Get student
        const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get user info
        const { data: user } = await supabase
            .from('users')
            .select('name, email, avatar_url')
            .eq('id', student.user_id)
            .single();

        // If student role, only allow own profile
        if (session.role === 'STUDENT') {
            const { data: myStudent } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', session.userId)
                .maybeSingle();

            if (!myStudent || myStudent.id !== student.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Get rating logs with faculty names
        const { data: ratingLogs } = await supabase
            .from('rating_logs')
            .select('*')
            .eq('student_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        // Get faculty names for logs
        const facultyIds = [...new Set((ratingLogs || []).map((l: Record<string, unknown>) => l.faculty_id as string))].filter(Boolean);
        const facultyNames: Record<string, string> = {};
        if (facultyIds.length > 0) {
            const { data: faculties } = await supabase
                .from('faculty')
                .select('id, user_id')
                .in('id', facultyIds);
            
            if (faculties) {
                const userIds = faculties.map((f: Record<string, unknown>) => f.user_id as string);
                const { data: facUsers } = await supabase
                    .from('users')
                    .select('id, name')
                    .in('id', userIds);
                
                if (facUsers) {
                    for (const fac of faculties) {
                        const u = facUsers.find((u: Record<string, unknown>) => u.id === fac.user_id);
                        if (u) facultyNames[fac.id as string] = (u as Record<string, unknown>).name as string;
                    }
                }
            }
        }

        // Get achievements
        const { data: achievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('student_id', id)
            .order('awarded_at', { ascending: false });

        // Get critical incidents
        const { data: criticalIncidents } = await supabase
            .from('critical_incidents')
            .select('*')
            .eq('student_id', id)
            .order('created_at', { ascending: false });

        const transformedStudent = {
            id: student.id,
            rollNumber: student.roll_number,
            department: student.department,
            year: student.year,
            rating: student.rating,
            clubs: student.clubs || [],
            qrCode: student.qr_code,
            user: {
                name: user?.name,
                email: user?.email,
                avatarUrl: user?.avatar_url,
            },
            ratingLogs: (ratingLogs || []).map((log: Record<string, unknown>) => ({
                id: log.id,
                pointChange: log.point_change,
                reason: log.reason,
                category: log.category,
                createdAt: log.created_at,
                faculty: { user: { name: facultyNames[log.faculty_id as string] || 'Unknown' } },
            })),
            achievements: (achievements || []).map((a: Record<string, unknown>) => ({
                id: a.id,
                title: a.title,
                description: a.description,
                badgeIcon: a.badge_icon,
                awardedAt: a.awarded_at,
                awardedBy: { user: { name: facultyNames[a.awarded_by_id as string] || 'Unknown' } },
            })),
            criticalIncidents: (criticalIncidents || []).map((inc: Record<string, unknown>) => ({
                id: inc.id,
                type: inc.type,
                severity: inc.severity,
                title: inc.title,
                description: inc.description,
                fineAmount: inc.fine_amount,
                escalatedTo: inc.escalated_to,
                status: inc.status,
                createdAt: inc.created_at,
                faculty: { user: { name: facultyNames[inc.faculty_id as string] || 'Unknown' } },
            })),
        };

        return NextResponse.json({ student: transformedStudent });
    } catch (err) {
        console.error('Student detail error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
