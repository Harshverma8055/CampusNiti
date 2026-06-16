import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const supabase = getSupabase();

        // Get the student to find user_id
        const { data: student } = await supabase.from('students').select('user_id').eq('id', id).single();
        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Update student fields
        const studentUpdate: Record<string, unknown> = {};
        if (body.department) studentUpdate.department = body.department;
        if (body.year) studentUpdate.year = body.year;
        if (body.rollNumber) studentUpdate.roll_number = body.rollNumber;

        if (Object.keys(studentUpdate).length > 0) {
            await supabase.from('students').update(studentUpdate).eq('id', id);
        }

        // Update user fields
        const userUpdate: Record<string, unknown> = {};
        if (body.name) userUpdate.name = body.name;
        if (body.email) userUpdate.email = body.email;

        if (Object.keys(userUpdate).length > 0) {
            await supabase.from('users').update(userUpdate).eq('id', student.user_id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin update student error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = getSupabase();

        // Get user_id first
        const { data: student } = await supabase.from('students').select('user_id').eq('id', id).single();
        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Delete cascading records
        await supabase.from('rating_logs').delete().eq('student_id', id);
        await supabase.from('student_streaks').delete().eq('student_id', id);
        await supabase.from('achievements').delete().eq('student_id', id);
        await supabase.from('critical_incidents').delete().eq('student_id', id);
        await supabase.from('students').delete().eq('id', id);
        await supabase.from('users').delete().eq('id', student.user_id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin delete student error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
