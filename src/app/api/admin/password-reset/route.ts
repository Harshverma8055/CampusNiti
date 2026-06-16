import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Valid userId and password (min 6 chars) required' }, { status: 400 });
        }

        const supabase = getSupabase();
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const { error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Password reset error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
