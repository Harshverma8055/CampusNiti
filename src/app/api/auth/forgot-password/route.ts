import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Check if user exists
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!user) {
            // For security reasons, we do not reveal if the email exists or not
            return NextResponse.json({ 
                success: true, 
                message: 'If the email exists, a reset link will be generated.' 
            });
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Store the token in the database
        const { error } = await supabase
            .from('password_resets')
            .insert({
                user_id: user.id,
                token: token,
                expires_at: expiresAt.toISOString(),
            });

        if (error) {
            console.error('Error storing reset token:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        // Return the token (FOR DEMO PURPOSES ONLY. In a real app, this is emailed securely)
        return NextResponse.json({
            success: true,
            demoToken: token,
            message: 'If the email exists, a reset link will be generated.',
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
