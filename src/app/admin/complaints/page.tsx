'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, XCircle, UserCheck, Eye, Clock, Wrench } from 'lucide-react';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import type { ComplaintListItem, ComplaintStatus } from '@/lib/complaints';
import { STATUS_LABELS, getStatusColor } from '@/lib/complaints';

type Tab = 'pending' | 'active' | 'resolved' | 'emergency' | 'all';

export default function AdminComplaintsPage() {
    const router = useRouter();
    const [tab, setTab]               = useState<Tab>('pending');
    const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [page, setPage]             = useState(1);
    const [hasMore, setHasMore]       = useState(false);
    const [total, setTotal]           = useState(0);
    const [staffList, setStaffList]   = useState<{id: string; name: string; department: string}[]>([]);
    const [actionId, setActionId]     = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [assignStaff, setAssignStaff]   = useState('');

    const load = useCallback(async (t: Tab, p: number) => {
        setLoading(true);
        let url = `/api/complaints?sort=priority&limit=10&page=${p}`;
        if (t === 'pending')   url += '&status=PENDING_REVIEW';
        if (t === 'active')    url += '&status=APPROVED,ASSIGNED,IN_PROGRESS';
        if (t === 'resolved')  url += '&status=RESOLVED';
        if (t === 'emergency') url += '&priority=EMERGENCY';
        const res = await fetch(url);
        const data = await res.json();
        setComplaints(data.complaints ?? []);
        setHasMore(data.hasMore ?? false);
        setTotal(data.total ?? 0);
        setLoading(false);
    }, []);

    useEffect(() => { load(tab, page); }, [tab, page, load]);

    const handleTabChange = (t: Tab) => {
        setTab(t);
        setPage(1); // Reset page on tab change
    };

    // Load maintenance staff
    useEffect(() => {
        fetch('/api/admin/maintenance-staff')
            .then(r => r.json())
            .then(d => {
                const rawStaff = d.staff ?? [];
                setStaffList(rawStaff.map((s: Record<string, unknown>) => ({
                    id: s.id as string,
                    name: (s.name as string) || 'Staff Member',
                    department: (s.department as string) || 'General',
                })));
            })
            .catch(() => { /* non-critical */ });
    }, []);

    async function doAction(id: string, action: Partial<{
        status: string; rejection_reason: string; assigned_staff_id: string; note: string;
    }>) {
        const res = await fetch(`/api/complaints/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action),
        });
        if (res.ok) {
            setComplaints(prev => prev.filter(c => c.id !== id));
            setActionId(null);
            setRejectReason('');
            setAssignStaff('');
        }
    }

    const TABS = [
        { key: 'pending' as Tab, label: 'Pending Review', icon: <Clock size={14} /> },
        { key: 'active' as Tab, label: 'Active / Working', icon: <Wrench size={14} /> },
        { key: 'resolved' as Tab, label: 'Resolved / Completed', icon: <CheckCircle size={14} /> },
        { key: 'emergency' as Tab, label: '🚨 Emergencies', icon: <AlertTriangle size={14} /> },
        { key: 'all' as Tab, label: 'All Complaints', icon: <Eye size={14} /> },
    ];

    const inputStyle = {
        width: '100%', padding: '8px 12px', background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: 14, marginTop: 6,
    };

    return (
        <div>
            <div className="page-header">
                <h1>Campus Issues Management 🏗️</h1>
                <p>Review, approve, assign, and track all campus infrastructure complaints.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', padding: 6, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        background: tab === t.key ? '#f59e0b' : 'transparent',
                        color: tab === t.key ? '#1a1a2e' : 'var(--text-muted)',
                        fontWeight: tab === t.key ? 700 : 400, fontSize: 13, transition: 'all 0.2s',
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: 200, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'skeleton-shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)', backgroundSize: '200% 100%' }} />
                    ))}
                </div>
            ) : complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p>{tab === 'pending' ? '✅ Moderation queue is clear!' : 'No complaints found.'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {complaints.map(c => (
                        <div key={c.id} style={{
                            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                            border: c.is_emergency ? '2px solid #dc2626' : '1px solid var(--border-color)',
                            overflow: 'hidden',
                        }}>
                            {/* Action bar */}
                            <div style={{ padding: '12px 20px', background: 'var(--bg-glass)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', flex: 1 }}>
                                    ID: {c.id.slice(0, 8).toUpperCase()} · Score: {c.priority_score}
                                </span>
                                <button onClick={() => router.push(`/admin/complaints/${c.id}`)}
                                    style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 20, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={13} /> View
                                </button>
                                {c.status === 'PENDING_REVIEW' && <>
                                    <button onClick={() => doAction(c.id, { status: 'APPROVED', note: 'Complaint reviewed and approved by admin.' })}
                                        style={{ padding: '6px 12px', background: '#22c55e', border: 'none', borderRadius: 20, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CheckCircle size={13} /> Approve
                                    </button>
                                    <button onClick={() => setActionId(actionId === c.id ? null : c.id)}
                                        style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: 20, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <XCircle size={13} /> Reject
                                    </button>
                                </>}
                                {(c.status === 'APPROVED' || c.status === 'IN_PROGRESS') && staffList.length > 0 && (
                                    <button onClick={() => setActionId(actionId === `assign-${c.id}` ? null : `assign-${c.id}`)}
                                        style={{ padding: '6px 12px', background: '#8b5cf6', border: 'none', borderRadius: 20, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <UserCheck size={13} /> Assign Staff
                                    </button>
                                )}
                            </div>

                            {/* Reject form */}
                            {actionId === c.id && (
                                <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Rejection Reason *</label>
                                    <input style={inputStyle} placeholder="Reason for rejection..."
                                        value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button disabled={!rejectReason.trim()}
                                            onClick={() => doAction(c.id, { status: 'REJECTED', rejection_reason: rejectReason, note: `Rejected: ${rejectReason}` })}
                                            style={{ padding: '6px 14px', background: '#ef4444', border: 'none', borderRadius: 16, cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, opacity: rejectReason.trim() ? 1 : 0.5 }}>
                                            Confirm Reject
                                        </button>
                                        <button onClick={() => setActionId(null)}
                                            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 16, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Assign staff form */}
                            {actionId === `assign-${c.id}` && (
                                <div style={{ padding: '12px 20px', background: 'rgba(139,92,246,0.05)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>Assign to Maintenance Staff</label>
                                    <select style={inputStyle} value={assignStaff} onChange={e => setAssignStaff(e.target.value)}>
                                        <option value="">-- Select Staff --</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} · {s.department}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button disabled={!assignStaff}
                                            onClick={() => doAction(c.id, { status: 'ASSIGNED', assigned_staff_id: assignStaff, note: `Assigned to maintenance staff.` })}
                                            style={{ padding: '6px 14px', background: '#8b5cf6', border: 'none', borderRadius: 16, cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, opacity: assignStaff ? 1 : 0.5 }}>
                                            Confirm Assign
                                        </button>
                                        <button onClick={() => setActionId(null)}
                                            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 16, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: 4 }}>
                                <ComplaintCard complaint={c} showVote={false} />
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {(total > 10) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                Showing page {page} ({complaints.length} of {total} complaints)
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!hasMore}
                                    style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: !hasMore ? 'var(--text-muted)' : 'var(--text-primary)', cursor: !hasMore ? 'not-allowed' : 'pointer' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
