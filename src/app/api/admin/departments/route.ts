import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { DEPARTMENTS } from '@/lib/department-router';
import type { DepartmentCode } from '@/lib/department-router';

// GET /api/admin/departments — Department performance stats
export async function GET(_req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const supabase = getSupabase();

    // Try to get stats from the department_performance view
    const { data: viewData, error: viewErr } = await supabase
        .from('department_performance')
        .select('*');

    if (!viewErr && viewData) {
        return NextResponse.json({ departments: viewData });
    }

    // Fallback: compute from complaints table if view doesn't exist yet
    const { data: complaints } = await supabase
        .from('complaints')
        .select('assigned_department_code, status, sla_breached, resolved_at, created_at');

    const stats = Object.values(DEPARTMENTS).map(dept => {
        const deptComplaints = (complaints ?? []).filter(c => c.assigned_department_code === dept.code);
        const resolved = deptComplaints.filter(c => c.status === 'RESOLVED');
        const active   = deptComplaints.filter(c => !['RESOLVED', 'REJECTED', 'CLOSED', 'ARCHIVED'].includes(c.status));
        const breached = deptComplaints.filter(c => c.sla_breached);

        const avgHours = resolved.length > 0
            ? resolved.reduce((sum, c) => {
                if (!c.resolved_at || !c.created_at) return sum;
                return sum + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 3600000;
            }, 0) / resolved.length
            : null;

        return {
            department_code:      dept.code as DepartmentCode,
            department_name:      dept.name,
            color:                dept.color,
            sla_hours:            dept.slaHours,
            total_complaints:     deptComplaints.length,
            resolved_count:       resolved.length,
            active_count:         active.length,
            sla_breached_count:   breached.length,
            avg_resolution_hours: avgHours ? Math.round(avgHours * 10) / 10 : null,
            resolution_rate_pct:  deptComplaints.length > 0
                ? Math.round((resolved.length / deptComplaints.length) * 100 * 10) / 10
                : 0,
        };
    });

    return NextResponse.json({ departments: stats });
}
