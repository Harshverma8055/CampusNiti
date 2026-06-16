import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const updateSchema = z.object({
    note:       z.string().min(5).max(1000),
    new_status: z.enum(['ASSIGNED','IN_PROGRESS','RESOLVED']).optional(),
    media_urls: z.array(z.string()).max(5).default([]),
    estimated_completion: z.string().optional().nullable(),
});

// GET /api/complaints/[id]/updates
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const supabase = getSupabase();

        const { data: updates, error } = await supabase
            .from('complaint_updates')
            .select(`
                id, note, old_status, new_status, media_urls, created_at,
                posted_by:users!complaint_updates_posted_by_id_fkey(id, name, role)
            `)
            .eq('complaint_id', id)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
        return NextResponse.json({ updates: updates ?? [] });
    } catch (err) {
        console.error('GET updates error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/complaints/[id]/updates — maintenance staff posts progress
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const allowed = ['ADMIN', 'MAINTENANCE'];
        if (!session || !allowed.includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id: complaintId } = await params;
        const body = await request.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
        }

        const supabase = getSupabase();

        // Get current status
        const { data: complaint } = await supabase
            .from('complaints').select('status').eq('id', complaintId).maybeSingle();
        if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Resolve posted_by_id — the hardcoded admin uses 'admin-permanent' which is 
        // not a valid UUID and doesn't exist in the users table. We need a real user ID.
        let postedById = session.userId;
        if (session.userId === 'admin-permanent') {
            const { data: adminUser } = await supabase
                .from('users').select('id').eq('role', 'ADMIN').limit(1).maybeSingle();
            if (adminUser) {
                postedById = adminUser.id;
            } else {
                // No admin user in DB — skip the timeline insert but still update status
                if (parsed.data.new_status) {
                    const statusUpdates: Record<string, unknown> = { status: parsed.data.new_status };
                    if (parsed.data.new_status === 'RESOLVED') {
                        statusUpdates.resolved_at = new Date().toISOString();
                    }
                    const { error: updateErr } = await supabase.from('complaints').update(statusUpdates).eq('id', complaintId);
                    if (updateErr) {
                        console.error('Complaint status update error:', updateErr);
                        return NextResponse.json({ error: 'Failed to update complaint status' }, { status: 500 });
                    }
                }
                return NextResponse.json({ success: true, update: null }, { status: 201 });
            }
        }

        // Insert timeline update
        const { data: update, error: insertErr } = await supabase
            .from('complaint_updates')
            .insert({
                complaint_id: complaintId,
                posted_by_id: postedById,
                old_status:   complaint.status,
                new_status:   parsed.data.new_status ?? complaint.status,
                note:         parsed.data.note,
                media_urls:   parsed.data.media_urls,
            })
            .select()
            .single();

        if (insertErr) {
            console.error('Update insert error:', insertErr);
            return NextResponse.json({ error: 'Failed to post update' }, { status: 500 });
        }

        // If status change provided, update complaint
        if (parsed.data.new_status) {
            const statusUpdates: Record<string, unknown> = { status: parsed.data.new_status };
            
            // Auto-assign to staff if they are claiming it
            if (session.role === 'MAINTENANCE' && ['ASSIGNED', 'IN_PROGRESS'].includes(parsed.data.new_status)) {
                const { data: mStaff } = await supabase.from('maintenance_staff').select('id').eq('user_id', session.userId).maybeSingle();
                if (mStaff) {
                    statusUpdates.assigned_staff_id = mStaff.id;
                    statusUpdates.assigned_at = new Date().toISOString();
                }
            }
            if (parsed.data.new_status === 'RESOLVED') {
                statusUpdates.resolved_at = new Date().toISOString();
                
                // If there are media urls, insert them into complaint_media as 'after' images
                if (parsed.data.media_urls && parsed.data.media_urls.length > 0) {
                    const mediaRows = parsed.data.media_urls.map((url: string) => ({
                        complaint_id:   complaintId,
                        storage_path:   url,
                        public_url:     url,
                        media_type:     url.match(/\.(mp4|mov|webm)($|\?)/i) ? 'VIDEO' : 'IMAGE',
                        is_before:      false,
                        is_after:       true,
                        uploaded_by_id: postedById,
                    }));
                    const { error: mediaErr } = await supabase.from('complaint_media').insert(mediaRows);
                    if (mediaErr) {
                        console.error('complaint_media insert error:', mediaErr);
                        // Non-blocking — continue with status update even if media insert fails
                    }
                }
            }
            if (parsed.data.estimated_completion !== undefined)
                statusUpdates.estimated_completion = parsed.data.estimated_completion;
            
            const { error: updateErr } = await supabase.from('complaints').update(statusUpdates).eq('id', complaintId);
            if (updateErr) {
                console.error('Complaint status update error:', updateErr);
                return NextResponse.json({ error: 'Failed to update complaint status', details: updateErr.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, update }, { status: 201 });
    } catch (err) {
        console.error('POST update error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
