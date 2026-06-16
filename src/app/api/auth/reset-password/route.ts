import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Valid token and password (min 6 chars) required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Find the token
        const { data: resetRecord, error: fetchError } = await supabase
            .from('password_resets')
            .select('user_id, expires_at')
            .eq('token', token)
            .single();

        if (fetchError || !resetRecord) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        // Check expiration
        if (new Date() > new Date(resetRecord.expires_at)) {
            // Delete expired token
            await supabase.from('password_resets').delete().eq('token', token);
            return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', resetRecord.user_id);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
        }

        // Delete used token
        await supabase.from('password_resets').delete().eq('token', token);

        return NextResponse.json({ success: true, message: 'Password has been successfully reset' });

    } catch (err) {
        console.error('Reset password error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
