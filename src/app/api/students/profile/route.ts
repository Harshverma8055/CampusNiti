import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// Helper: ensure the clubs column exists, create it if not
async function ensureClubsColumn() {
    const supabase = getSupabase();
    // Try a quick probe — select clubs from one row
    const { error } = await supabase
        .from('students')
        .select('clubs')
        .limit(1);

    if (error && error.message.includes('clubs')) {
        // Column doesn't exist — create it via raw SQL
        console.log('clubs column missing, creating it now...');
        const { error: rpcError } = await supabase.rpc('exec_sql', {
            query: "ALTER TABLE students ADD COLUMN IF NOT EXISTS clubs JSONB DEFAULT '[]';"
        });
        if (rpcError) {
            console.error('Failed to auto-create clubs column via RPC:', rpcError);
            // Fallback: try direct SQL if RPC not available
            // The column will need to be created manually
            return false;
        }
        return true;
    }
    return true; // column already exists
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', session.userId)
            .single();

        if (error) {
            console.error('Failed to fetch student profile:', error);
            return NextResponse.json({ error: 'Failed to fetch profile', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ clubs: data?.clubs || [] });
    } catch (err) {
        console.error('Clubs GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { clubs } = body;

        if (!Array.isArray(clubs)) {
            return NextResponse.json({ error: 'Invalid clubs format' }, { status: 400 });
        }

        const supabase = getSupabase();

        // First verify the student exists
        const { data: student, error: findError } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', session.userId)
            .single();

        if (findError || !student) {
            console.error('Student not found for user_id:', session.userId, findError);
            return NextResponse.json({ error: 'Student record not found', details: findError?.message }, { status: 404 });
        }

        // Ensure clubs column exists before updating
        await ensureClubsColumn();

        // Update clubs
        const { data, error } = await supabase
            .from('students')
            .update({ clubs })
            .eq('id', student.id)
            .select('*')
            .single();

        if (error) {
            console.error('Supabase clubs update error:', error);

            // If column still doesn't exist, give a clear actionable message
            if (error.message.includes('clubs') && error.message.includes('schema')) {
                return NextResponse.json({
                    error: 'Database migration required',
                    details: "The 'clubs' column needs to be added to the students table. Please run this SQL in your Supabase SQL Editor: ALTER TABLE students ADD COLUMN IF NOT EXISTS clubs JSONB DEFAULT '[]';"
                }, { status: 500 });
            }

            return NextResponse.json({ error: 'Failed to update clubs', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, clubs: data?.clubs || clubs });
    } catch (err) {
        console.error('Clubs PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

