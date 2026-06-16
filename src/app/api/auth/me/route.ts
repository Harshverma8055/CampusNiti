import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const ADMIN_USER_ID = 'admin-permanent';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Handle permanent admin user
        if (session.userId === ADMIN_USER_ID) {
            return NextResponse.json({
                user: {
                    id: ADMIN_USER_ID,
                    email: session.email,
                    name: session.name,
                    role: 'ADMIN',
                    studentId: null,
                    facultyId: null,
                    rollNumber: null,
                    department: null,
                },
            });
        }

        const supabase = getSupabase();

        // Get user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found', debug: userError }, { status: 404 });
        }

        // Get student record separately
        const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', session.userId)
            .maybeSingle();

        // Get faculty record separately
        const { data: facultyData } = await supabase
            .from('faculty')
            .select('*')
            .eq('user_id', session.userId)
            .maybeSingle();

        // Get maintenance staff record separately
        const { data: maintenanceData } = await supabase
            .from('maintenance_staff')
            .select('*')
            .eq('user_id', session.userId)
            .maybeSingle();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                studentId: studentData?.id || null,
                facultyId: facultyData?.id || null,
                rollNumber: studentData?.roll_number || null,
                department: studentData?.department || facultyData?.department || maintenanceData?.department || null,
                designation: facultyData?.designation || null,
                maintenanceDept: maintenanceData?.department || null,
                maintenanceId: maintenanceData?.id || null,
                specialization: maintenanceData?.specialization || [],
                staffCode: maintenanceData?.staff_code || null,
            },
        });
    } catch (err) {
        console.error('Auth me error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
