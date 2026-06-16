import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { sendPushToUsers } from '@/lib/webpush';
import { ComplaintNotifications } from '@/lib/complaint-notifications';
import { routeComplaint } from '@/lib/department-router';
import type { ComplaintCategory, CampusZone, ComplaintSeverity } from '@/lib/complaints';

// ─── Validation Schema ────────────────────────────────────────────────────────
const createComplaintSchema = z.object({
    title:        z.string().min(10).max(200),
    description:  z.string().min(20).max(2000),
    category:     z.enum(['ELECTRICAL','PLUMBING','CIVIL','SANITATION','IT_NETWORK',
                          'FURNITURE','EQUIPMENT','SAFETY','HOSTEL','SPORTS','CAFETERIA','OTHER']),
    severity:     z.enum(['LOW','MODERATE','HIGH','CRITICAL']),
    zone:         z.enum(['ACADEMIC_BLOCK','HOSTEL_BOYS','HOSTEL_GIRLS','LIBRARY','LAB',
                          'SPORTS_COMPLEX','CAFETERIA','PARKING','ROAD','MAIN_GATE',
                          'AUDITORIUM','ADMIN_BLOCK','OTHER']),
    building:     z.string().max(100).optional(),
    floor:        z.string().max(20).optional(),
    room:         z.string().max(50).optional(),
    gps_lat:      z.number().min(-90).max(90).optional(),
    gps_lng:      z.number().min(-180).max(180).optional(),
    is_anonymous: z.boolean().default(false),
    is_emergency: z.boolean().default(false),
    media_paths:  z.array(z.string()).max(5).default([]),  // storage paths from /api/complaints/upload
});

const listQuerySchema = z.object({
    status:     z.string().optional(),
    category:   z.string().optional(),
    zone:       z.string().optional(),
    priority:   z.string().optional(),
    department: z.string().optional(),
    search:     z.string().max(100).optional(),
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(50).default(20),
    sort:       z.enum(['latest','priority','upvotes']).default('priority'),
});

// ─── GET /api/complaints ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const query = listQuerySchema.parse(Object.fromEntries(searchParams));
        const supabase = getSupabase();
        const offset = (query.page - 1) * query.limit;

        let studentId: string | null = null;
        if (session.role === 'STUDENT') {
            const { data: s } = await supabase
                .from('students').select('id').eq('user_id', session.userId).maybeSingle();
            studentId = s?.id ?? null;
        }

        // Build base query
        let dbQuery = supabase
            .from('complaints')
            .select(`
                id, title, category, zone, building, severity, priority,
                priority_score, status, is_anonymous, is_emergency,
                upvote_count, comment_count, sla_deadline, sla_breached,
                created_at, reporter_student_id, assigned_staff_id, assigned_department_code,
                complaint_media(public_url, is_before, media_type)
            `, { count: 'exact' });

        // Role-based filters
        if (session.role === 'STUDENT') {
            // Students see pending/approved/resolved/in-progress complaints + their own (excluding rejected/archived from others)
            dbQuery = dbQuery.or(
                `status.in.(PENDING_REVIEW,APPROVED,ASSIGNED,IN_PROGRESS,RESOLVED),reporter_student_id.eq.${studentId}`
            );
        }
        // Faculty see all non-pending
        if (session.role === 'FACULTY') {
            dbQuery = dbQuery.not('status', 'eq', 'PENDING_REVIEW');
        }
        // Maintenance see non-pending for their department AND only unassigned or assigned to them
        if (session.role === 'MAINTENANCE') {
            dbQuery = dbQuery.not('status', 'eq', 'PENDING_REVIEW');
            const { data: mStaff } = await supabase
                .from('maintenance_staff').select('id, department_code, department').eq('user_id', session.userId).maybeSingle();
            
            if (mStaff && (mStaff.department_code || mStaff.department)) {
                // Must be in their department (filter out nulls explicitly)
                const conditions = [];
                if (mStaff.department_code) conditions.push(`assigned_department_code.eq.${mStaff.department_code}`);
                if (mStaff.department) conditions.push(`assigned_department_code.eq.${mStaff.department}`);
                
                dbQuery = dbQuery.or(conditions.join(','));
                
                // Must be unassigned OR assigned to this specific staff member
                dbQuery = dbQuery.or(`assigned_staff_id.is.null,assigned_staff_id.eq.${mStaff.id}`);
            } else {
                // Misconfigured staff member (no department record) should see nothing
                dbQuery = dbQuery.eq('assigned_department_code', 'NONE_ASSIGNED_ERROR');
            }
        }
        // Admin sees everything

        // Filters
        if (query.status) {
            if (query.status.includes(',')) {
                dbQuery = dbQuery.in('status', query.status.split(','));
            } else {
                dbQuery = dbQuery.eq('status', query.status);
            }
        }
        if (query.category)   dbQuery = dbQuery.eq('category', query.category);
        if (query.zone)       dbQuery = dbQuery.eq('zone', query.zone);
        if (query.priority)   dbQuery = dbQuery.eq('priority', query.priority);
        if (query.department) dbQuery = dbQuery.eq('assigned_department_code', query.department);
        if (query.search)     dbQuery = dbQuery.ilike('title', `%${query.search}%`);

        // Sort
        if (query.sort === 'priority')
            dbQuery = dbQuery.order('priority_score', { ascending: false });
        else if (query.sort === 'upvotes')
            dbQuery = dbQuery.order('upvote_count', { ascending: false });
        else
            dbQuery = dbQuery.order('created_at', { ascending: false });

        dbQuery = dbQuery.range(offset, offset + query.limit - 1);

        const { data: rows, error, count } = await dbQuery;
        if (error) {
            console.error('Complaints list error:', error);
            return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
        }

        // Get student vote status
        let votedSet = new Set<string>();
        if (studentId && rows?.length) {
            const ids = rows.map((r: Record<string, unknown>) => r.id as string);
            const { data: votes } = await supabase
                .from('complaint_votes')
                .select('complaint_id')
                .eq('student_id', studentId)
                .in('complaint_id', ids);
            votedSet = new Set((votes ?? []).map((v: Record<string, unknown>) => v.complaint_id as string));
        }

        // Get reporter names (skip anonymous)
        const reporterIds: string[] = [];
        (rows ?? []).forEach((r: Record<string, unknown>) => {
            if (!r.is_anonymous && r.reporter_student_id) reporterIds.push(r.reporter_student_id as string);
        });
        const reporterMap: Record<string, { name: string; rollNumber?: string }> = {};
        if (reporterIds.length) {
            const { data: reporters } = await supabase
                .from('students').select('id, user_id, roll_number').in('id', reporterIds);
            const userIds = (reporters ?? []).map((r: Record<string, unknown>) => r.user_id as string);
            if (userIds.length) {
                const { data: users } = await supabase
                    .from('users').select('id, name').in('id', userIds);
                const uMap: Record<string, string> = {};
                (users ?? []).forEach((u: Record<string, unknown>) => { uMap[u.id as string] = u.name as string; });
                (reporters ?? []).forEach((r: Record<string, unknown>) => {
                    reporterMap[r.id as string] = {
                        name: uMap[r.user_id as string] ?? 'Student',
                        rollNumber: r.roll_number as string | undefined
                    };
                });
            }
        }

        const complaints = (rows ?? []).map((r: Record<string, unknown>) => {
            const media = (r.complaint_media as Array<Record<string, unknown>>) ?? [];
            const beforeImg = media.find(m => m.is_before && m.media_type === 'IMAGE');
            const afterImg = media.find(m => m.is_after && m.media_type === 'IMAGE');
            return {
                id:            r.id,
                title:         r.title,
                category:      r.category,
                zone:          r.zone,
                building:      r.building,
                severity:      r.severity,
                priority:      r.priority,
                priority_score:r.priority_score,
                status:        r.status,
                assigned_staff_id: r.assigned_staff_id,
                assigned_department_code: r.assigned_department_code,
                is_anonymous:  r.is_anonymous,
                is_emergency:  r.is_emergency,
                upvote_count:  r.upvote_count,
                comment_count: r.comment_count,
                sla_deadline:  r.sla_deadline,
                sla_breached:  r.sla_breached,
                created_at:    r.created_at,
                has_voted:     votedSet.has(r.id as string),
                thumbnail:     beforeImg?.public_url ?? null,
                after_thumbnail: afterImg?.public_url ?? null,
                reporter:      r.is_anonymous ? null
                    : reporterMap[r.reporter_student_id as string] || { name: 'Student' },
            };
        });

        return NextResponse.json({
            complaints,
            total: count ?? 0,
            page:  query.page,
            limit: query.limit,
            hasMore: (count ?? 0) > offset + query.limit,
        });
    } catch (err) {
        console.error('GET /api/complaints error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── POST /api/complaints ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Student access required' }, { status: 403 });
        }

        const body = await request.json();
        const parsed = createComplaintSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Get student record
        const { data: student } = await supabase
            .from('students').select('id').eq('user_id', session.userId).maybeSingle();
        if (!student) return NextResponse.json({ error: 'Student record not found' }, { status: 404 });

        // Rate limiting: max 5 complaints per day per student
        const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
        const { count: todayCount } = await supabase
            .from('complaints')
            .select('id', { count: 'exact', head: true })
            .eq('reporter_student_id', student.id)
            .gte('created_at', dayAgo);
        if ((todayCount ?? 0) >= 5) {
            return NextResponse.json(
                { error: 'Daily complaint limit reached (5 per day). Try again tomorrow.' },
                { status: 429 }
            );
        }

        // Duplicate detection: check if exact same title/category/zone was submitted in last 24h
        const { data: duplicate } = await supabase
            .from('complaints')
            .select('id')
            .eq('reporter_student_id', student.id)
            .eq('title', parsed.data.title)
            .eq('category', parsed.data.category)
            .eq('zone', parsed.data.zone)
            .gte('created_at', dayAgo)
            .maybeSingle();
            
        if (duplicate) {
            return NextResponse.json(
                { error: 'Duplicate complaint detected. You have already reported this issue.' },
                { status: 409 }
            );
        }

        const { media_paths, ...complaintData } = parsed.data;

        // ── Auto Department Routing ──────────────────────────────────────────
        const routing = routeComplaint({
            category:    parsed.data.category as ComplaintCategory,
            zone:        parsed.data.zone as CampusZone,
            severity:    parsed.data.severity as ComplaintSeverity,
            isEmergency: parsed.data.is_emergency,
            priority:    parsed.data.is_emergency ? 'EMERGENCY' : 'MODERATE',
        });

        // Insert complaint with department assignment
        const { data: complaint, error: insertErr } = await supabase
            .from('complaints')
            .insert({
                ...complaintData,
                reporter_student_id:      student.id,
                status:                   'PENDING_REVIEW',
                assigned_department_code: routing.department,
                routing_confidence:       routing.confidence,
                routing_reason:           routing.reason,
            })
            .select()
            .single();

        if (insertErr || !complaint) {
            console.error('Complaint insert error:', insertErr);
            return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
        }

        // Attach media if provided
        if (media_paths.length > 0) {
            const mediaRows = media_paths.map((urlOrPath: string) => ({
                complaint_id:   complaint.id,
                storage_path:   urlOrPath,
                public_url:     urlOrPath,  // signed URL stored for direct display
                media_type:     urlOrPath.match(/\.(mp4|mov|webm)($|\?)/i) ? 'VIDEO' : 'IMAGE',
                is_before:      true,
                is_after:       false,
                uploaded_by_id: session.userId,
            }));
            await supabase.from('complaint_media').insert(mediaRows);
        }

        // Notify all admins if emergency
        if (parsed.data.is_emergency) {
            const { data: adminUsers } = await supabase
                .from('users').select('id').eq('role', 'ADMIN');
            const adminIds = (adminUsers ?? []).map((u: Record<string, unknown>) => u.id as string);
            if (adminIds.length) {
                await sendPushToUsers(adminIds, ComplaintNotifications.emergency(
                    complaint.id, parsed.data.title
                ));
            }
        } else {
            // Notify admins about new complaint (non-blocking)
            const { data: adminUsers } = await supabase
                .from('users').select('id').eq('role', 'ADMIN');
            const adminIds = (adminUsers ?? []).map((u: Record<string, unknown>) => u.id as string);
            if (adminIds.length) {
                sendPushToUsers(adminIds, ComplaintNotifications.newComplaintToAdmin(
                    complaint.id, parsed.data.zone
                )).catch(console.warn);
            }
        }

        return NextResponse.json({ success: true, complaintId: complaint.id }, { status: 201 });
    } catch (err) {
        console.error('POST /api/complaints error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
