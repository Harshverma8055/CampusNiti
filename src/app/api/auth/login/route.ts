import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// Hardcoded permanent admin credentials
const ADMIN_EMAIL = 'gabbar@admin.op';
const ADMIN_PASSWORD = 'gabbar';
const ADMIN_USER_ID = 'admin-permanent';
const ADMIN_NAME = 'Gabbar Admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid email or password format' },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        // Check for hardcoded admin login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const token = await signToken({
                userId: ADMIN_USER_ID,
                email: ADMIN_EMAIL,
                name: ADMIN_NAME,
                role: 'ADMIN',
            });

            const response = NextResponse.json({
                success: true,
                user: {
                    id: ADMIN_USER_ID,
                    email: ADMIN_EMAIL,
                    name: ADMIN_NAME,
                    role: 'ADMIN',
                    studentId: null,
                    facultyId: null,
                },
            });

            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24,
                path: '/',
            });

            return response;
        }

        // Regular user login via database
        const supabase = getSupabase();

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        console.log("Login attempt for email:", email);
        console.log("User found:", user ? "yes" : "no", "Error:", error);

        if (error || !user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: facultyData } = await supabase
            .from('faculty')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: maintenanceData } = await supabase
            .from('maintenance_staff')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'STUDENT' | 'FACULTY' | 'ADMIN' | 'MAINTENANCE',
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                studentId: studentData?.id || null,
                facultyId: facultyData?.id || null,
                maintenanceId: maintenanceData?.id || null,
            },
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
