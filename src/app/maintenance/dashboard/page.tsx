'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Wrench, CheckCircle, Clock, UserPlus, Image as ImageIcon } from 'lucide-react';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import { getSLATimeLeft } from '@/lib/complaints';
import type { ComplaintListItem } from '@/lib/complaints';

export default function MaintenanceDashboard() {
    const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [updating, setUpdating]     = useState<string | null>(null);
    const [noteMap, setNoteMap]       = useState<Record<string, string>>({});
    const [fileMap, setFileMap]       = useState<Record<string, File>>({});

    const [userDept, setUserDept]     = useState<string | null>(null);
    const [myId, setMyId]             = useState<string | null>(null);
    const [role, setRole]             = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        let deptCode: string | null = null;
        let staffId: string | null = null;

        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.user) {
                setRole(meData.user.role);
                deptCode = meData.user.maintenanceDept || null;
                staffId = meData.user.maintenanceId || null;
                setUserDept(deptCode);
                setMyId(staffId);
            }
        }

        const deptParam = deptCode ? `&department=${encodeURIComponent(deptCode)}` : '';
        const res = await fetch(`/api/complaints?sort=priority&limit=50&status=APPROVED,ASSIGNED${deptParam}`);
        const data = await res.json();
        
        const res2 = await fetch(`/api/complaints?sort=priority&limit=50&status=IN_PROGRESS${deptParam}`);
        const data2 = await res2.json();
        
        setComplaints([...(data.complaints ?? []), ...(data2.complaints ?? [])]);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    async function uploadFile(file: File): Promise<string | null> {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('bucket', 'complaint-after');
        const res = await fetch('/api/complaints/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data.signedUrl || data.storagePath;
    }

    async function updateStatus(id: string, newStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED', requireNote = true) {
        const note = noteMap[id]?.trim() || (requireNote ? '' : 'Job accepted');
        if (requireNote && !note && newStatus !== 'ASSIGNED') { 
            alert('Please add a progress note before updating status.'); 
            return; 
        }
        
        let media_urls: string[] = [];
        if (newStatus === 'RESOLVED') {
            const file = fileMap[id];
            if (!file) {
                alert('Please upload an image of the completed work before marking as resolved.');
                return;
            }
            setUpdating(id);
            try {
                const path = await uploadFile(file);
                if (path) media_urls.push(path);
            } catch (err: unknown) {
                alert((err as Error).message || 'Failed to upload image.');
                setUpdating(null);
                return;
            }
        } else {
            setUpdating(id);
        }

        try {
            const res = await fetch(`/api/complaints/${id}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note, new_status: newStatus, media_urls }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Failed to update status: ${data.error || 'Unknown error'}${data.details ? '\n' + JSON.stringify(data.details) : ''}`);
                setUpdating(null);
                return;
            }
            await load();
            setUpdating(null);
            setNoteMap(prev => ({ ...prev, [id]: '' }));
            setFileMap(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        } catch (err: unknown) {
            alert(`Network error: ${(err as Error).message}`);
            setUpdating(null);
        }
    }

    // Isolate complaints into the 3 distinct real-world queues:
    // 1. Available Jobs: Approved by admin, but not assigned to any specific staff member yet.
    const availableJobs = complaints.filter(c => c.status === 'APPROVED' && !c.assigned_staff_id);
    
    // 2. My Tasks: Assigned specifically to me (or I accepted them), waiting for me to start.
    const myTasks = complaints.filter(c => c.status === 'ASSIGNED' && (c.assigned_staff_id === myId || role === 'ADMIN'));
    
    // 3. In Progress: I am currently working on this.
    const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS' && (c.assigned_staff_id === myId || role === 'ADMIN'));

    const breachedCount = complaints.filter(c => c.sla_breached).length;

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: 14, outline: 'none'
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1>{userDept ? `${userDept.replace(/_/g, ' ')} Panel` : 'Maintenance Dashboard'}</h1>
                    <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Wrench size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: '-2px' }} />
                        Staff Console
                    </span>
                </div>
                <p>Manage your real-world maintenance workflow. Pick up available jobs and track your progress.</p>
            </div>

            {role === 'ADMIN' && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} /> You are viewing this as an Admin.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Admins see ALL complaints across the entire campus since they are not bound to a single department. To see the exact restricted view of a specific staff member, please log in with a staff account.
                    </p>
                </div>
            )}

            {/* KPI row */}
            <div className="stats-grid" style={{ marginBottom: 36 }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div className="stat-icon amber"><UserPlus size={20} /></div>
                    <div className="stat-value">{availableJobs.length}</div>
                    <div className="stat-label" style={{ fontWeight: 600 }}>Available Jobs</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div className="stat-icon blue"><Clock size={20} /></div>
                    <div className="stat-value">{myTasks.length}</div>
                    <div className="stat-label" style={{ fontWeight: 600 }}>My Tasks</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05))', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <div className="stat-icon purple"><Wrench size={20} /></div>
                    <div className="stat-value">{inProgress.length}</div>
                    <div className="stat-label" style={{ fontWeight: 600 }}>In Progress</div>
                </div>
            </div>

            {/* Available Jobs Queue */}
            <Section 
                title="📋 Available Jobs Pool" 
                subtitle="Unassigned issues waiting for a staff member. Accept a job to add it to your tasks."
                items={availableJobs} 
                icon={<UserPlus size={18} />} 
                color="#f59e0b" 
                renderAction={(c) => (
                    <button
                        disabled={updating === c.id}
                        onClick={() => updateStatus(c.id, 'ASSIGNED', false)}
                        style={{ padding: '10px 20px', background: 'var(--bg-glass)', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', color: '#f59e0b', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <UserPlus size={16} />
                        {updating === c.id ? 'Accepting...' : 'Accept Job'}
                    </button>
                )}
            />

            {/* My Tasks */}
            <Section 
                title="⚡ My Assigned Tasks" 
                subtitle="Tasks assigned to you. Click start when you begin working on them."
                items={myTasks} 
                icon={<Clock size={18} />} 
                color="#3b82f6" 
                renderAction={(c) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            disabled={updating === c.id}
                            onClick={() => updateStatus(c.id, 'IN_PROGRESS', false)}
                            style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                            <Wrench size={16} />
                            {updating === c.id ? 'Starting...' : 'Start Work'}
                        </button>
                    </div>
                )}
            />

            {/* In Progress */}
            <Section 
                title="🔧 Currently Working On" 
                subtitle="Issues you are actively fixing. Upload a photo of the completed work to resolve."
                items={inProgress} 
                icon={<Wrench size={18} />} 
                color="#06b6d4" 
                renderAction={(c) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(6, 182, 212, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Resolution Notes</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                placeholder="Describe exactly what was fixed..."
                                value={noteMap[c.id] ?? ''}
                                onChange={e => setNoteMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                            />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={14} /> Work Evidence (Required)
                            </label>
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: fileMap[c.id] ? '2px solid #10b981' : '2px dashed var(--border-color)',
                                background: fileMap[c.id] ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-glass)',
                                padding: '24px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) setFileMap(prev => ({ ...prev, [c.id]: file }));
                                    }}
                                    style={{ display: 'none' }}
                                />
                                {fileMap[c.id] ? (
                                    <>
                                        <CheckCircle size={24} color="#10b981" style={{ marginBottom: '8px' }} />
                                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>{fileMap[c.id].name}</span>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={24} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '13px' }}>Tap to take a photo or upload</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>PNG, JPG up to 10MB</span>
                                    </>
                                )}
                            </label>
                        </div>
                        
                        <button
                            disabled={updating === c.id}
                            onClick={() => updateStatus(c.id, 'RESOLVED')}
                            style={{ padding: '12px 20px', background: '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', marginTop: '8px' }}>
                            <CheckCircle size={18} />
                            {updating === c.id ? 'Saving...' : 'Mark as Resolved'}
                        </button>
                    </div>
                )}
            />
        </div>
    );

    // Helper component for rendering sections
    function Section({ title, subtitle, items, icon, color, renderAction }: {
        title: string; subtitle: string; items: ComplaintListItem[];
        icon: React.ReactNode; color: string;
        renderAction: (c: ComplaintListItem) => React.ReactNode;
    }) {
        if (items.length === 0) return null; // Don't show empty sections to keep UI clean

        return (
            <div style={{ marginBottom: 48 }}>
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <div style={{ background: `${color}20`, color, padding: 8, borderRadius: 8 }}>{icon}</div>
                        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>{title}</h2>
                        <span style={{ background: `${color}20`, color, borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>
                            {items.length}
                        </span>
                    </div>
                    <p style={{ margin: '0 0 0 46px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{subtitle}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {items.map(c => (
                        <div key={c.id} style={{
                            background: 'var(--bg-secondary)', borderRadius: '12px',
                            border: c.sla_breached ? '2px solid #dc2626' : '1px solid var(--border-color)',
                            overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                            {/* SLA indicator */}
                            <div style={{
                                padding: '10px 16px', background: c.sla_breached ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-glass)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid var(--border-color)', fontSize: 12,
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'monospace' }}>
                                    #{c.id.slice(0, 8).toUpperCase()}
                                </span>
                                {c.sla_deadline && (
                                    <span style={{
                                        color: c.sla_breached ? '#dc2626' : '#f59e0b',
                                        fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <Clock size={14} />
                                        {c.sla_breached ? 'SLA BREACHED' : getSLATimeLeft(c.sla_deadline)}
                                    </span>
                                )}
                            </div>

                            <div style={{ padding: '8px', flex: 1 }}>
                                <ComplaintCard complaint={c} showVote={false} />
                            </div>

                            {/* Action Area */}
                            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
                                {renderAction(c)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
