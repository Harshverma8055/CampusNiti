import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// GET /api/admin/maintenance-staff — list all staff for admin dropdowns
export async function GET(_req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('maintenance_staff')
        .select('id, staff_code, department, specialization, is_active, user:users!maintenance_staff_user_id_fkey(id, name, email)')
        .eq('is_active', true)
        .order('department');

    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    const staff = (data ?? []).map((s: Record<string, unknown>) => ({
        id:             s.id,
        staffCode:      s.staff_code,
        department:     s.department,
        specialization: s.specialization,
        name:           (s.user as Record<string, unknown>)?.name ?? 'Staff',
        email:          (s.user as Record<string, unknown>)?.email ?? '',
    }));

    return NextResponse.json({ staff });
}

// POST /api/admin/maintenance-staff — create a new staff member
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const { userId, staffCode, department, specialization } = await request.json();
    if (!userId || !staffCode || !department) {
        return NextResponse.json({ error: 'userId, staffCode, department required' }, { status: 400 });
    }
    const supabase = getSupabase();
    // Update user role
    await supabase.from('users').update({ role: 'MAINTENANCE' }).eq('id', userId);
    const { data, error } = await supabase
        .from('maintenance_staff')
        .insert({ user_id: userId, staff_code: staffCode, department, specialization: specialization ?? [] })
        .select().single();
    if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    return NextResponse.json({ success: true, staff: data }, { status: 201 });
}
