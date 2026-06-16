'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import {
    getPriorityColor, getStatusColor, getCategoryIcon,
    STATUS_LABELS, PRIORITY_LABELS, ZONE_LABELS, CATEGORY_LABELS,
    getSLATimeLeft,
} from '@/lib/complaints';
import { MapPin, AlertTriangle, ArrowLeft, CheckCircle, XCircle, UserCheck, Clock, Shield } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export default function AdminComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<AnyRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [staffList, setStaffList] = useState<{ id: string; name: string; department: string }[]>([]);
    const [rejectReason, setRejectReason] = useState('');
    const [assignStaff, setAssignStaff] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [actionPanel, setActionPanel] = useState<'reject' | 'assign' | 'note' | 'resolve' | null>(null);
    const [processing, setProcessing] = useState(false);
    const [resolvePhotoUrl, setResolvePhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const refresh = () => {
        setLoading(true);
        fetch(`/api/complaints/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load');
                return res.json();
            })
            .then(d => { if (d.error) throw new Error(d.error); setData(d.complaint); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { refresh(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch('/api/admin/maintenance-staff')
            .then(r => r.json())
            .then(d => {
                const raw = d.staff ?? [];
                setStaffList(raw.map((s: AnyRecord) => ({
                    id: s.id,
                    name: s.name || 'Staff Member',
                    department: s.department || 'General',
                })));
            })
            .catch(() => {});
    }, []);

    async function doAction(patch: AnyRecord) {
        setProcessing(true);
        try {
            const res = await fetch(`/api/complaints/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (res.ok) {
                setActionPanel(null);
                setRejectReason('');
                setAssignStaff('');
                setActionNote('');
                refresh();
            } else {
                const d = await res.json();
                alert(d.error || 'Action failed');
            }
        } finally {
            setProcessing(false);
        }
    }

    async function uploadImage(file: File): Promise<string> {
        const ext = file.name.split('.').pop() || 'jpg';
        const res = await fetch('/api/complaints/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: `resolve-${id}-${Date.now()}.${ext}`, contentType: file.type })
        });
        const { signedUrl, publicUrl } = await res.json();
        await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        return publicUrl;
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: 14, marginTop: 8, boxSizing: 'border-box',
    };
    const btnBase: React.CSSProperties = {
        padding: '8px 18px', border: 'none', borderRadius: 20, cursor: 'pointer',
        fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
    };

    if (loading) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
    );

    if (error || !data) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#ef4444' }}>{error || 'Complaint not found'}</p>
            <button onClick={() => router.back()} className="btn" style={{ marginTop: 16 }}>← Back</button>
        </div>
    );

    const pColor = getPriorityColor(data.priority);
    const sColor = getStatusColor(data.status);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <button onClick={() => router.push('/admin/complaints')} className="btn" style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <ArrowLeft size={16} /> Back to Queue
            </button>

            {/* Admin Action Bar */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={13} /> ADMIN ACTIONS — ID: {id.slice(0, 8).toUpperCase()} · Score: {data.priority_score}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {data.status === 'PENDING_REVIEW' && (
                        <>
                            <button
                                style={{ ...btnBase, background: '#22c55e', color: 'white' }}
                                onClick={() => doAction({ status: 'APPROVED', note: 'Complaint reviewed and approved by admin.' })}
                                disabled={processing}
                            >
                                <CheckCircle size={14} /> Approve
                            </button>
                            <button
                                style={{ ...btnBase, background: '#ef4444', color: 'white' }}
                                onClick={() => setActionPanel(actionPanel === 'reject' ? null : 'reject')}
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        </>
                    )}
                    {['APPROVED', 'IN_PROGRESS', 'ASSIGNED'].includes(data.status) && staffList.length > 0 && (
                        <button
                            style={{ ...btnBase, background: '#8b5cf6', color: 'white' }}
                            onClick={() => setActionPanel(actionPanel === 'assign' ? null : 'assign')}
                        >
                            <UserCheck size={14} /> Assign / Reassign Staff
                        </button>
                    )}
                    {['ASSIGNED', 'IN_PROGRESS'].includes(data.status) && (
                        <button
                            style={{ ...btnBase, background: '#22c55e', color: 'white' }}
                            onClick={() => setActionPanel(actionPanel === 'resolve' ? null : 'resolve')}
                            disabled={processing}
                        >
                            <CheckCircle size={14} /> Mark Resolved
                        </button>
                    )}
                    <button
                        style={{ ...btnBase, background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => setActionPanel(actionPanel === 'note' ? null : 'note')}
                    >
                        + Add Note
                    </button>
                </div>

                {/* Reject form */}
                {actionPanel === 'reject' && (
                    <div style={{ marginTop: 14, padding: 16, background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Rejection Reason *</label>
                        <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Explain why this complaint is being rejected..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                disabled={!rejectReason.trim() || processing}
                                onClick={() => doAction({ status: 'REJECTED', rejection_reason: rejectReason, note: `Rejected: ${rejectReason}` })}
                                style={{ ...btnBase, background: '#ef4444', color: 'white', opacity: !rejectReason.trim() ? 0.5 : 1 }}
                            >
                                Confirm Reject
                            </button>
                            <button onClick={() => setActionPanel(null)} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Assign form */}
                {actionPanel === 'assign' && (
                    <div style={{ marginTop: 14, padding: 16, background: 'rgba(139,92,246,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>Select Maintenance Staff</label>
                        <select style={inputStyle} value={assignStaff} onChange={e => setAssignStaff(e.target.value)}>
                            <option value="">-- Select Staff --</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.name} · {s.department}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                disabled={!assignStaff || processing}
                                onClick={() => doAction({ status: 'ASSIGNED', assigned_staff_id: assignStaff, note: 'Assigned to maintenance staff by admin.' })}
                                style={{ ...btnBase, background: '#8b5cf6', color: 'white', opacity: !assignStaff ? 0.5 : 1 }}
                            >
                                <UserCheck size={14} /> Confirm Assign
                            </button>
                            <button onClick={() => setActionPanel(null)} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Note form */}
                {actionPanel === 'note' && (
                    <div style={{ marginTop: 14, padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>Admin Note</label>
                        <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Add an internal note or status update..." value={actionNote} onChange={e => setActionNote(e.target.value)} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                disabled={!actionNote.trim() || processing}
                                onClick={() => doAction({ note: actionNote })}
                                style={{ ...btnBase, background: '#6366f1', color: 'white', opacity: !actionNote.trim() ? 0.5 : 1 }}
                            >
                                Save Note
                            </button>
                            <button onClick={() => setActionPanel(null)} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Resolve form */}
                {actionPanel === 'resolve' && (
                    <div style={{ marginTop: 14, padding: 16, background: 'rgba(34,197,94,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', display: 'block', marginBottom: 8 }}>Resolution Proof (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploading(true);
                                try {
                                    const url = await uploadImage(file);
                                    setResolvePhotoUrl(url);
                                } catch (err) {
                                    alert('Failed to upload image');
                                } finally {
                                    setUploading(false);
                                }
                            }}
                            style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-primary)' }}
                            disabled={uploading || processing}
                        />
                        {uploading && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Uploading image...</div>}
                        {resolvePhotoUrl && <img src={resolvePhotoUrl} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 12, border: '1px solid var(--border-color)' }} />}
                        
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                disabled={uploading || processing}
                                onClick={() => doAction({ status: 'RESOLVED', note: 'Marked as resolved by admin.', after_photo_url: resolvePhotoUrl || undefined })}
                                style={{ ...btnBase, background: '#22c55e', color: 'white', opacity: (uploading || processing) ? 0.5 : 1 }}
                            >
                                <CheckCircle size={14} /> Confirm Resolution
                            </button>
                            <button onClick={() => { setActionPanel(null); setResolvePhotoUrl(''); }} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main complaint detail */}
            <div className="card" style={{ padding: 24 }}>
                {data.is_emergency && (
                    <div style={{ background: '#dc2626', color: 'white', padding: '10px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                        <AlertTriangle size={18} /> EMERGENCY ISSUE — Requires Immediate Response
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{getCategoryIcon(data.category)}</span>
                    <div>
                        <h1 style={{ margin: '0 0 4px', fontSize: 22, color: 'var(--text-primary)' }}>{data.title}</h1>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Category: {CATEGORY_LABELS[data.category as keyof typeof CATEGORY_LABELS] || data.category}
                        </span>
                    </div>
                </div>

                {/* Status badges */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ color: pColor, background: `${pColor}20`, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {PRIORITY_LABELS[data.priority as keyof typeof PRIORITY_LABELS] || data.priority}
                    </span>
                    <span style={{ color: sColor, background: `${sColor}20`, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {STATUS_LABELS[data.status as keyof typeof STATUS_LABELS] || data.status}
                    </span>
                    {data.sla_deadline && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                            borderRadius: 20, fontSize: 13, fontWeight: 700,
                            color: data.sla_breached ? '#dc2626' : '#f59e0b',
                            background: data.sla_breached ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
                        }}>
                            <Clock size={12} />
                            {data.sla_breached ? '⚠ SLA BREACHED' : `SLA: ${getSLATimeLeft(data.sla_deadline)}`}
                        </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                        <MapPin size={13} /> {ZONE_LABELS[data.zone as keyof typeof ZONE_LABELS] || data.zone}
                        {data.building ? ` · ${data.building}` : ''}
                        {data.floor ? ` · ${data.floor}` : ''}
                        {data.room ? ` (${data.room})` : ''}
                    </span>
                </div>

                {/* Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                        ['Severity', data.severity],
                        ['Upvotes', data.upvote_count ?? 0],
                        ['Submitted', new Date(data.created_at).toLocaleDateString('en-IN')],
                        ['Priority Score', data.priority_score],
                        ['Anonymous', data.is_anonymous ? 'Yes' : 'No'],
                        ['Emergency', data.is_emergency ? '🚨 Yes' : 'No'],
                    ].map(([label, value]) => (
                        <div key={String(label)} style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{String(value)}</div>
                        </div>
                    ))}
                </div>

                {/* Assigned staff */}
                {data.assigned_staff && (
                    <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139,92,246,0.3)', marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 4 }}>ASSIGNED TO</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {data.assigned_staff.staff_user?.name || 'Staff'} — {data.assigned_staff.department}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: data.complaint_media?.length ? 20 : 0 }}>
                    {data.description}
                </div>

                {/* Evidence & Resolution Media */}
                {data.complaint_media && data.complaint_media.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {data.complaint_media.some((m: AnyRecord) => m.is_before) && (
                            <div>
                                <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 15, color: 'var(--text-primary)' }}>📎 Evidence (Before)</h3>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {(data.complaint_media as AnyRecord[]).filter(m => m.is_before).map((media: AnyRecord) => (
                                        <a key={media.id} href={media.public_url} target="_blank" rel="noopener noreferrer">
                                            <img src={media.public_url} alt="Evidence" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', cursor: 'pointer' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {data.complaint_media.some((m: AnyRecord) => m.is_after) && (
                            <div>
                                <h3 style={{ marginTop: 10, marginBottom: 12, fontSize: 15, color: '#22c55e' }}>✅ Resolution Proof (After)</h3>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {(data.complaint_media as AnyRecord[]).filter(m => m.is_after).map((media: AnyRecord) => (
                                        <a key={media.id} href={media.public_url} target="_blank" rel="noopener noreferrer">
                                            <img src={media.public_url} alt="Resolution Proof" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #22c55e', cursor: 'pointer' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Timeline */}
            {data.complaint_updates && data.complaint_updates.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: 'var(--text-primary)' }}>📋 Status Timeline</h2>
                    <ComplaintTimeline updates={data.complaint_updates} currentStatus={data.status} createdAt={data.created_at} />
                </div>
            )}
        </div>
    );
}
