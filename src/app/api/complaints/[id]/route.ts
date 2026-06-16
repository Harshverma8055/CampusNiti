import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { sendPushToUsers } from '@/lib/webpush';
import { ComplaintNotifications } from '@/lib/complaint-notifications';
import { routeComplaint } from '@/lib/department-router';
import type { ComplaintCategory, CampusZone, ComplaintSeverity, ComplaintPriority } from '@/lib/complaints';

const patchSchema = z.object({
    status:                z.enum(['APPROVED','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED','ARCHIVED']).optional(),
    assigned_staff_id:     z.string().uuid().optional().nullable(),
    rejection_reason:      z.string().max(500).optional(),
    estimated_completion:  z.string().optional().nullable(),
    note:                  z.string().max(1000).optional(),
    priority:              z.enum(['LOW','MODERATE','HIGH','CRITICAL','EMERGENCY']).optional(),
    after_photo_url:       z.string().url().optional().nullable(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field required' });

// ─── GET /api/complaints/[id] ─────────────────────────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const supabase = getSupabase();

        const { data: complaint, error } = await supabase
            .from('complaints')
            .select(`
                *,
                complaint_media(id, public_url, media_type, is_before, is_after, uploaded_at),
                complaint_comments(
                    id, content, is_official, is_deleted, created_at,
                    author:users!complaint_comments_author_id_fkey(id, name, role)
                ),
                complaint_updates(
                    id, note, old_status, new_status, media_urls, created_at,
                    posted_by:users!complaint_updates_posted_by_id_fkey(id, name, role)
                ),
                assigned_staff:maintenance_staff(
                    id, department,
                    staff_user:users!maintenance_staff_user_id_fkey(name)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
        }

        // Students can only view approved/public complaints or their own
        if (session.role === 'STUDENT') {
            const { data: student } = await supabase
                .from('students').select('id').eq('user_id', session.userId).maybeSingle();
            const isOwn = complaint.reporter_student_id === student?.id;
            const isPublic = ['PENDING_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','RESOLVED'].includes(complaint.status);
            if (!isOwn && !isPublic) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            // Check vote and follow status
            const [voteRes, followRes] = await Promise.all([
                supabase.from('complaint_votes')
                    .select('id', { count: 'exact', head: true })
                    .eq('complaint_id', id).eq('student_id', student?.id ?? ''),
                supabase.from('complaint_followers')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('complaint_id', id).eq('user_id', session.userId),
            ]);

            // Remove the media filter so all students can view evidence photos
            // if (!isOwn && complaint.complaint_media) {
            //     complaint.complaint_media = complaint.complaint_media.filter((m: any) => !m.is_before);
            // }

            return NextResponse.json({
                complaint: {
                    ...complaint,
                    reporter: complaint.is_anonymous ? null : complaint.reporter_student_id,
                    has_voted: (voteRes.count ?? 0) > 0,
                    is_followed: (followRes.count ?? 0) > 0,
                },
            });
        }

        return NextResponse.json({ complaint });
    } catch (err) {
        console.error('GET /api/complaints/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PATCH /api/complaints/[id] ───────────────────────────────────────────────
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const allowedRoles = ['ADMIN', 'MAINTENANCE'];
        if (!session || !allowedRoles.includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
        }

        const supabase = getSupabase();

        // Get current complaint
        const { data: current } = await supabase
            .from('complaints').select('status, reporter_student_id, category, zone, severity, is_emergency, priority, assigned_department_code').eq('id', id).maybeSingle();
        if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updates: Record<string, unknown> = {};
        if (parsed.data.status)                updates.status = parsed.data.status;
        if (parsed.data.assigned_staff_id !== undefined) {
            updates.assigned_staff_id = parsed.data.assigned_staff_id;
            if (parsed.data.assigned_staff_id) updates.assigned_at = new Date().toISOString();
        }
        if (parsed.data.rejection_reason)      updates.rejection_reason = parsed.data.rejection_reason;
        if (parsed.data.estimated_completion !== undefined) updates.estimated_completion = parsed.data.estimated_completion;
        if (parsed.data.priority)              updates.priority = parsed.data.priority;
        if (parsed.data.status === 'RESOLVED') updates.resolved_at = new Date().toISOString();

        // Fix: Auto-route to department if approved and no department assigned
        if (parsed.data.status === 'APPROVED' && !current.assigned_department_code) {
            const routing = routeComplaint({
                category: current.category as ComplaintCategory,
                zone: current.zone as CampusZone,
                severity: current.severity as ComplaintSeverity,
                isEmergency: current.is_emergency,
                priority: current.priority as ComplaintPriority,
            });
            updates.assigned_department_code = routing.department;
            updates.routing_confidence = routing.confidence;
            updates.routing_reason = routing.reason;
        }

        let updated = current;
        if (Object.keys(updates).length > 0) {
            const { data: upData, error: updateErr } = await supabase
                .from('complaints')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateErr) {
                console.error('Complaint update error:', updateErr);
                const isRlsError = updateErr.message?.includes('row-level security') || updateErr.code === 'PGRST116';
                const msg = isRlsError ? 'Update failed: Check if SUPABASE_SERVICE_ROLE_KEY is set in Vercel' : 'Update failed';
                return NextResponse.json({ error: msg }, { status: 500 });
            }
            updated = upData;
        }

        // Log the update in timeline
        if (parsed.data.status || parsed.data.note) {
            // Resolve posted_by_id for hardcoded admin
            let postedById = session.userId;
            if (session.userId === 'admin-permanent') {
                const { data: adminUser } = await supabase
                    .from('users').select('id').eq('role', 'ADMIN').limit(1).maybeSingle();
                if (adminUser) postedById = adminUser.id;
            }
            if (postedById !== 'admin-permanent') {
                await supabase.from('complaint_updates').insert({
                    complaint_id:  id,
                    posted_by_id:  postedById,
                    old_status:    current.status,
                    new_status:    parsed.data.status ?? current.status,
                    note:          parsed.data.note ?? `Status updated to ${parsed.data.status ?? current.status}`,
                    media_urls:    parsed.data.after_photo_url ? [parsed.data.after_photo_url] : [],
                });
            }
        }

        // Insert after_photo_url into media if provided
        if (parsed.data.after_photo_url) {
            await supabase.from('complaint_media').insert({
                complaint_id:   id,
                storage_path:   parsed.data.after_photo_url,
                public_url:     parsed.data.after_photo_url,
                media_type:     parsed.data.after_photo_url.match(/\.(mp4|mov|webm)($|\?)/i) ? 'VIDEO' : 'IMAGE',
                is_before:      false,
                is_after:       true,
                uploaded_by_id: session.userId,
            });
        }

        // Notify reporter and followers
        const followerIds: string[] = [];
        const { data: followers } = await supabase
            .from('complaint_followers').select('user_id').eq('complaint_id', id);
        (followers ?? []).forEach((f: Record<string, unknown>) => {
            if (f.user_id !== session.userId) followerIds.push(f.user_id as string);
        });

        // Get reporter's user_id
        let reporterUserId: string | null = null;
        if (current.reporter_student_id) {
            const { data: reporter } = await supabase
                .from('students').select('user_id').eq('id', current.reporter_student_id).maybeSingle();
            reporterUserId = reporter?.user_id ?? null;
        }

        const notifyIds = [...new Set([
            ...followerIds,
            ...(reporterUserId ? [reporterUserId] : []),
        ])];

        if (notifyIds.length && parsed.data.status) {
            let payload;
            if (parsed.data.status === 'RESOLVED') {
                payload = ComplaintNotifications.resolved(id);
            } else if (parsed.data.status === 'REJECTED') {
                payload = ComplaintNotifications.rejected(id, parsed.data.rejection_reason ?? 'No reason provided');
            } else if (parsed.data.status === 'ASSIGNED') {
                payload = ComplaintNotifications.assigned(id, 'Maintenance Staff');
            } else {
                payload = ComplaintNotifications.statusChanged(id, parsed.data.status);
            }
            await sendPushToUsers(notifyIds, payload);
        }

        return NextResponse.json({ success: true, complaint: updated });
    } catch (err) {
        console.error('PATCH /api/complaints/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE /api/complaints/[id] ─────────────────────────────────────────────
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { id } = await params;
        const supabase = getSupabase();

        // Archive instead of hard-delete to preserve audit trail
        const { error } = await supabase
            .from('complaints').update({ status: 'ARCHIVED' }).eq('id', id);
        if (error) return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/complaints/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
