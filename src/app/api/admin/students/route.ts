import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { z } from 'zod';

const createStudentSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    rollNumber: z.string().min(3).max(20),
    department: z.string().min(2),
    year: z.number().int().min(1).max(4),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const department = searchParams.get('department') || '';
        const year = searchParams.get('year') || '';

        let query = supabase
            .from('students')
            .select('*, user:users(id, name, email)')
            .order('created_at', { ascending: false });

        if (department) query = query.eq('department', department);
        if (year) query = query.eq('year', parseInt(year));

        const { data: students, error } = await query;

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
        }

        let filtered = students || [];
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter((s: { roll_number: string; user: { name: string; email: string } }) =>
                s.user?.name?.toLowerCase().includes(lowerSearch) ||
                s.user?.email?.toLowerCase().includes(lowerSearch) ||
                s.roll_number?.toLowerCase().includes(lowerSearch)
            );
        }

        return NextResponse.json({
            students: filtered.map((s: { id: string; roll_number: string; department: string; year: number; rating: number; created_at: string; user: { id: string; name: string; email: string } }) => ({
                id: s.id,
                userId: s.user?.id,
                name: s.user?.name,
                email: s.user?.email,
                rollNumber: s.roll_number,
                department: s.department,
                year: s.year,
                rating: s.rating,
                createdAt: s.created_at,
            })),
        });
    } catch (err) {
        console.error('Admin students GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = createStudentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
        }

        let { name, email, password, rollNumber, department, year } = parsed.data;
        const supabase = getSupabase();

        // Normalize department names
        const deptMap: Record<string, string> = {
            "BT": "Biotechnology",
            "CE": "Civil Engineering",
            "CM": "Chemical Engineering",
            "CS": "Computer Science and Engineering",
            "DS": "Data Science and Engineering",
            "EC": "Electronics and Communication Engineering",
            "EE": "Electrical Engineering",
            "IC": "Instrumentation and Control Engineering",
            "IP": "Industrial and Production Engineering",
            "IT": "Information Technology",
            "MC": "Mathematics and Computing",
            "ME": "Mechanical Engineering",
            "TT": "Textile Technology"
        };
        if (deptMap[department]) {
            department = deptMap[department];
        }

        // Check duplicates
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const { data: existingRoll } = await supabase.from('students').select('id').eq('roll_number', rollNumber).single();
        if (existingRoll) {
            return NextResponse.json({ error: 'Roll number already registered' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({ name, email, password: hashedPassword, role: 'STUDENT' })
            .select()
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create student
        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({ user_id: user.id, roll_number: rollNumber, department, year, rating: 100 })
            .select()
            .single();

        if (studentError || !student) {
            await supabase.from('users').delete().eq('id', user.id);
            return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
        }

        // Generate QR code
        try {
            const qrCodeData = await QRCode.toDataURL(student.id, {
                width: 300, margin: 2,
                color: { dark: '#6366f1', light: '#0a0e1a' },
            });
            await supabase.from('students').update({ qr_code: qrCodeData }).eq('id', student.id);
        } catch (e) {
            console.error('QR generation failed:', e);
        }

        // Create streak record
        await supabase.from('student_streaks').insert({ student_id: student.id });

        return NextResponse.json({
            success: true,
            student: { id: student.id, name, email, rollNumber, department, year },
        });
    } catch (err) {
        console.error('Admin create student error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
