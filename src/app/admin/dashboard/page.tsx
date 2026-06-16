'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, GraduationCap, AlertTriangle, TrendingUp, TrendingDown, Plus, Megaphone, ArrowRight } from 'lucide-react';

interface Stats {
    totalStudents: number;
    totalFaculty: number;
    pendingIncidents: number;
    avgRating: number;
    lowRatingCount: number;
}

interface RecentLog {
    id: string;
    pointChange: number;
    reason: string;
    category: string;
    createdAt: string;
    studentName: string;
    studentRoll: string;
    facultyName: string;
}

interface DeptBreakdown {
    name: string;
    count: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
    const [deptBreakdown, setDeptBreakdown] = useState<DeptBreakdown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.stats) setStats(data.stats);
                if (data.recentLogs) setRecentLogs(data.recentLogs);
                if (data.departmentBreakdown) setDeptBreakdown(data.departmentBreakdown);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>👑</span> Admin Dashboard
                </h1>
                <p>Complete system overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/students')}>
                    <div className="stat-icon amber"><GraduationCap size={20} /></div>
                    <div className="stat-value">{stats?.totalStudents || 0}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/faculty')}>
                    <div className="stat-icon purple"><Users size={20} /></div>
                    <div className="stat-value">{stats?.totalFaculty || 0}</div>
                    <div className="stat-label">Total Faculty</div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/incidents')}>
                    <div className="stat-icon rose"><AlertTriangle size={20} /></div>
                    <div className="stat-value">{stats?.pendingIncidents || 0}</div>
                    <div className="stat-label">Pending Incidents</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sky"><TrendingUp size={20} /></div>
                    <div className="stat-value">{stats?.avgRating || 0}</div>
                    <div className="stat-label">Avg Rating</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon rose"><TrendingDown size={20} /></div>
                    <div className="stat-value">{stats?.lowRatingCount || 0}</div>
                    <div className="stat-label">Low Rating (&lt;70)</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="responsive-grid-thirds">
                <button className="btn btn-primary" style={{ padding: 20, fontSize: 15, justifyContent: 'center' }} onClick={() => router.push('/admin/students')}>
                    <Plus size={18} /> Create Student
                </button>
                <button className="btn btn-outline" style={{ padding: 20, fontSize: 15, justifyContent: 'center', borderColor: 'rgba(99, 102, 241, 0.3)' }} onClick={() => router.push('/admin/faculty')}>
                    <Plus size={18} /> Create Faculty
                </button>
                <button className="btn btn-outline" style={{ padding: 20, fontSize: 15, justifyContent: 'center', borderColor: 'rgba(245, 158, 11, 0.3)' }} onClick={() => router.push('/admin/announcements')}>
                    <Megaphone size={18} /> Post Announcement
                </button>
            </div>

            <div className="responsive-grid-half">
                {/* Department Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h2>Department Breakdown</h2>
                    </div>
                    <div className="card-body">
                        {deptBreakdown.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No students yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {deptBreakdown.sort((a, b) => b.count - a.count).map(dept => {
                                    const maxCount = Math.max(...deptBreakdown.map(d => d.count));
                                    return (
                                        <div key={dept.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{dept.name}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-amber)' }}>{dept.count}</span>
                                            </div>
                                            <div style={{ height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${(dept.count / maxCount) * 100}%`,
                                                    background: 'linear-gradient(90deg, var(--accent-amber), #d97706)',
                                                    borderRadius: 3,
                                                    transition: 'width 1s ease',
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h2>Recent Activity</h2>
                        <button className="btn btn-sm btn-outline" onClick={() => router.push('/admin/audit-log')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                        {recentLogs.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No recent activity</p>
                        ) : (
                            <div className="data-table-wrapper"><table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Change</th>
                                        <th>By</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontWeight: 600, fontSize: 13 }}>{log.studentName}</td>
                                            <td>
                                                <span className={`badge ${log.pointChange > 0 ? 'badge-positive' : 'badge-negative'}`}>
                                                    {log.pointChange > 0 ? '+' : ''}{log.pointChange}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.facultyName}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
