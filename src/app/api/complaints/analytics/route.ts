import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// GET /api/complaints/analytics — admin analytics dashboard data
export async function GET(_request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const supabase = getSupabase();

        const [
            byZoneResult,
            byCategoryResult,
            byStatusResult,
            recent30Result,
            resolvedRecentResult,
            emergenciesResult,
            slaBreachedResult,
            topReportersResult,
        ] = await Promise.all([
            // Complaints by zone
            supabase.from('complaints')
                .select('zone')
                .then(({ data }) => groupBy(data ?? [], 'zone')),

            // Complaints by category
            supabase.from('complaints')
                .select('category')
                .then(({ data }) => groupBy(data ?? [], 'category')),

            // By status
            supabase.from('complaints')
                .select('status')
                .then(({ data }) => groupBy(data ?? [], 'status')),

            // Last 30 days submissions by day
            supabase.from('complaints')
                .select('created_at')
                .gte('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
                .order('created_at', { ascending: true }),

            // Resolved in last 30 days
            supabase.from('complaints')
                .select('resolved_at, created_at')
                .eq('status', 'RESOLVED')
                .gte('resolved_at', new Date(Date.now() - 30 * 86_400_000).toISOString()),

            // Emergency count
            supabase.from('complaints')
                .select('id', { count: 'exact', head: true })
                .eq('is_emergency', true)
                .not('status', 'in', '("RESOLVED","ARCHIVED","REJECTED")'),

            // SLA breached
            supabase.from('complaints')
                .select('id', { count: 'exact', head: true })
                .eq('sla_breached', true)
                .not('status', 'in', '("RESOLVED","ARCHIVED","REJECTED")'),

            // Top reporters (non-anonymous)
            supabase.from('complaints')
                .select('reporter_student_id')
                .eq('is_anonymous', false)
                .not('reporter_student_id', 'is', null)
                .then(({ data }) =>
                    Object.entries(
                        groupBy(data ?? [], 'reporter_student_id')
                    ).sort((a, b) => b[1] - a[1]).slice(0, 5)
                ),
        ]);

        const resolvedRecent = resolvedRecentResult.data ?? [];
        const recent30 = recent30Result.data ?? [];

        // Calculate average resolution time in hours
        const resolvedWithTime = resolvedRecent.filter(
            (r: Record<string, unknown>) => r.resolved_at && r.created_at
        );
        const avgResolutionHours = resolvedWithTime.length > 0
            ? resolvedWithTime.reduce((sum: number, r: Record<string, unknown>) => {
                const ms = new Date(r.resolved_at as string).getTime() -
                           new Date(r.created_at as string).getTime();
                return sum + ms / 3_600_000;
            }, 0) / resolvedWithTime.length
            : 0;

        // Build daily trend chart data (last 30 days)
        const dailyCounts: Record<string, number> = {};
        recent30.forEach((r: Record<string, unknown>) => {
            const day = new Date(r.created_at as string).toISOString().slice(0, 10);
            dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
        });
        const dailyTrend = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

        return NextResponse.json({
            byZone:                byZoneResult,
            byCategory:            byCategoryResult,
            byStatus:              byStatusResult,
            dailyTrend,
            avgResolutionHours:    Math.round(avgResolutionHours),
            activeEmergencies:     emergenciesResult.count ?? 0,
            slaBreachedCount:      slaBreachedResult.count ?? 0,
            resolvedThisMonth:     resolvedRecent.length,
            topReporters:          topReportersResult,
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function groupBy(arr: Record<string, unknown>[], key: string): Record<string, number> {
    return arr.reduce((acc: Record<string, number>, item) => {
        const k = String(item[key] ?? 'UNKNOWN');
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
    }, {});
}
