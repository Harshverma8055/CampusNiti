'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle } from 'lucide-react';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import type { ComplaintListItem } from '@/lib/complaints';

export default function MaintenanceHistory() {
    const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
    const [loading, setLoading]       = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        // Fetch user info for department name
        let deptCode: string | null = null;
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.user?.maintenanceDept) {
                deptCode = meData.user.maintenanceDept;
            }
        }

        const deptParam = deptCode ? `&department=${encodeURIComponent(deptCode)}` : '';
        // Fetch only RESOLVED complaints for this user's department
        const res = await fetch(`/api/complaints?sort=newest&limit=50&status=RESOLVED${deptParam}`);
        const data = await res.json();
        setComplaints(data.complaints ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Resolved History <CheckCircle size={24} style={{ color: '#10b981', display: 'inline-block', verticalAlign: 'middle', marginLeft: 8 }} /></h1>
                <p>A complete log of all campus issues you have successfully resolved.</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <div className="stat-card">
                    <div className="stat-icon emerald"><ClipboardList size={20} /></div>
                    <div className="stat-value">{complaints.length}</div>
                    <div className="stat-label">Total Resolved Issues</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {complaints.map(c => (
                    <div key={c.id} style={{
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        opacity: 0.85, // Slightly faded to indicate it is closed
                    }}>
                        {/* Status indicator */}
                        <div style={{
                            padding: '8px 16px', background: 'var(--bg-glass)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--border-color)', fontSize: 12,
                        }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                                ID: {c.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span style={{
                                color: '#10b981',
                                fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <CheckCircle size={12} />
                                RESOLVED
                            </span>
                        </div>

                        <div style={{ padding: 4 }}>
                            <ComplaintCard complaint={c} showVote={false} />
                        </div>
                    </div>
                ))}
                
                {complaints.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <CheckCircle size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Resolved Issues Yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
                            When you finish working on complaints and mark them as resolved, they will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
