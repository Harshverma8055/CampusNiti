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

        // Search strategy: 
        // 1. If it looks like a UUID, try matching by ID first
        // 2. Otherwise/Fallback: try matching by roll_number
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let student = null;

        if (isUUID) {
            const { data: idMatch } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            student = idMatch;
        }

        // If not found by ID (or it wasn't a UUID), try finding by Roll Number
        if (!student) {
            const { data: rollMatch, error: rollError } = await supabase
                .from('students')
                .select('*')
                .eq('roll_number', id)
                .maybeSingle();
            
            if (rollMatch) {
                student = rollMatch;
            } else if (rollError) {
                console.error('Database error during lookup:', rollError);
            }
        }

        if (!student) {
             console.warn(`Student with identifier ${id} not found.`);
             return NextResponse.json({ error: 'Student not found', details: 'No match for ID or Roll Number' }, { status: 404 });
        }

        // Get user name and avatar only
        const { data: user } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', student.user_id)
            .single();

        // Get achievements
        const { data: achievements } = await supabase
            .from('achievements')
            .select('id, title, description, badge_icon, awarded_at')
            .eq('student_id', student.id)
            .order('awarded_at', { ascending: false });

        return NextResponse.json({
            student: {
                id: student.id,
                name: user?.name,
                avatarUrl: user?.avatar_url,
                rollNumber: student.roll_number,
                department: student.department,
                year: student.year,
                clubs: student.clubs || [],
                achievements: achievements || [],
                // NO RATING OR LOGS RETURNED HERE
            }
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
