import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const adjustSchema = z.object({
    studentId: z.string().min(1),
    pointChange: z.number().int().min(-50).max(50),
    reason: z.string().min(3).max(500),
    category: z.enum(['DISCIPLINE', 'PARTICIPATION', 'ACHIEVEMENT', 'BEHAVIOR', 'OTHER']),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'FACULTY' && session.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized. Faculty access required.' }, { status: 403 });
        }

        const body = await request.json();
        const parsed = adjustSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { studentId, pointChange, reason, category } = parsed.data;

        if (category === 'ACHIEVEMENT' && pointChange < 0) {
            return NextResponse.json({ error: 'Cannot deduct points for an achievement.' }, { status: 400 });
        }

        if (category === 'DISCIPLINE' && pointChange > 0) {
            return NextResponse.json({ error: 'Discipline points can only be deducted (negative).' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Get faculty record
        const { data: faculty, error: facError } = await supabase
            .from('faculty')
            .select('id')
            .eq('user_id', session.userId)
            .single();

        if (facError || !faculty) {
            return NextResponse.json({ error: 'Faculty record not found' }, { status: 404 });
        }

        // Call the atomic adjust_rating function
        const { data, error } = await supabase.rpc('adjust_rating', {
            p_student_id: studentId,
            p_faculty_id: faculty.id,
            p_point_change: pointChange,
            p_reason: reason,
            p_category: category,
        });

        if (error) {
            console.error('Rating adjust error:', error);
            return NextResponse.json({ error: 'Failed to adjust rating' }, { status: 500 });
        }

        const result = data?.[0] || data;

        // If category is ACHIEVEMENT, create a formal achievement record
        if (category === 'ACHIEVEMENT' && pointChange > 0) {
            await supabase
                .from('achievements')
                .insert({
                    student_id: studentId,
                    title: `Achievement: ${pointChange} Points`,
                    description: reason,
                    badge_icon: '🏆', // Default icon for automated achievements
                    awarded_by_id: faculty.id,
                    awarded_at: new Date().toISOString()
                });
        }

        return NextResponse.json({
            success: true,
            log: { id: result.log_id },
            newRating: result.new_rating,
        });
    } catch (err) {
        console.error('Rating adjust error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
