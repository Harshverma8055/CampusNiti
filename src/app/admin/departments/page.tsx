'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, CheckCircle, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/department-router';
import type { DepartmentCode } from '@/lib/department-router';

interface DeptStats {
    department_code:     DepartmentCode;
    department_name:     string;
    color:               string;
    sla_hours:           number;
    total_complaints:    number;
    resolved_count:      number;
    active_count:        number;
    sla_breached_count:  number;
    avg_resolution_hours: number | null;
    resolution_rate_pct: number | null;
}

export default function AdminDepartmentsPage() {
    const [stats, setStats] = useState<DeptStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'table'>('grid');

    useEffect(() => {
        fetch('/api/admin/departments')
            .then(r => r.json())
            .then(d => {
                setStats(d.departments ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Fallback: show all departments with zero stats if API not set up yet
    const displayStats: DeptStats[] = stats.length > 0
        ? stats
        : Object.values(DEPARTMENTS).map(d => ({
            department_code:     d.code,
            department_name:     d.name,
            color:               d.color,
            sla_hours:           d.slaHours,
            total_complaints:    0,
            resolved_count:      0,
            active_count:        0,
            sla_breached_count:  0,
            avg_resolution_hours: null,
            resolution_rate_pct: null,
        }));

    const totalComplaints = displayStats.reduce((s, d) => s + (d.total_complaints || 0), 0);
    const totalResolved   = displayStats.reduce((s, d) => s + (d.resolved_count || 0), 0);
    const totalBreached   = displayStats.reduce((s, d) => s + (d.sla_breached_count || 0), 0);
    const totalActive     = displayStats.reduce((s, d) => s + (d.active_count || 0), 0);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1>Department Management 🏛️</h1>
                    <p>19 departments across NIT Jalandhar campus infrastructure. View complaint load, SLA compliance, and resolution metrics.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setView('grid')}
                        style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: view === 'grid' ? 'var(--accent-primary)' : 'var(--bg-glass)', color: view === 'grid' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setView('table')}
                        style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: view === 'table' ? 'var(--accent-primary)' : 'var(--bg-glass)', color: view === 'table' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
                    >
                        Table
                    </button>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Departments', value: 19, icon: <Building2 size={20} />, color: '#6366f1' },
                    { label: 'All Time Complaints', value: totalComplaints, icon: <BarChart3 size={20} />, color: '#f59e0b' },
                    { label: 'Resolved', value: totalResolved, icon: <CheckCircle size={20} />, color: '#22c55e' },
                    { label: 'Active Issues', value: totalActive, icon: <Clock size={20} />, color: '#06b6d4' },
                    { label: 'SLA Breaches', value: totalBreached, icon: <AlertTriangle size={20} />, color: '#ef4444' },
                ].map(kpi => (
                    <div key={kpi.label} className="stat-card">
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, color: kpi.color }}>
                            {kpi.icon}
                        </div>
                        <div className="stat-value">{kpi.value}</div>
                        <div className="stat-label">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {displayStats.map(dept => {
                        const deptInfo = DEPARTMENTS[dept.department_code];
                        const resRate = dept.resolution_rate_pct ?? 0;
                        return (
                            <div key={dept.department_code} className="card" style={{ padding: 20, borderLeft: `4px solid ${dept.color || deptInfo?.color || '#6366f1'}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, background: `${dept.color || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Building2 size={18} color={dept.color || '#6366f1'} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
                                            {deptInfo?.shortName || dept.department_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                            {deptInfo?.headTitle || 'Department Head'}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                                    {[
                                        { label: 'Total', value: dept.total_complaints, color: 'var(--text-primary)' },
                                        { label: 'Active', value: dept.active_count, color: '#f59e0b' },
                                        { label: 'Resolved', value: dept.resolved_count, color: '#22c55e' },
                                    ].map(s => (
                                        <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Resolution bar */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resolution Rate</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: resRate >= 80 ? '#22c55e' : resRate >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {resRate.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--bg-glass)', borderRadius: 2 }}>
                                        <div style={{ height: '100%', borderRadius: 2, width: `${resRate}%`, background: resRate >= 80 ? '#22c55e' : resRate >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {dept.sla_breached_count > 0 && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                                                <AlertTriangle size={11} /> {dept.sla_breached_count} breached
                                            </span>
                                        )}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            SLA: {dept.sla_hours}h
                                        </span>
                                    </div>
                                    <Link
                                        href={`/admin/complaints?department=${dept.department_code}`}
                                        style={{ fontSize: 12, fontWeight: 600, color: dept.color || '#6366f1', textDecoration: 'none' }}
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Table view
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Department', 'Head Role', 'Total', 'Active', 'Resolved', 'SLA (hrs)', 'Resolution %', 'Breaches'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayStats.map((dept, i) => {
                                    const deptInfo = DEPARTMENTS[dept.department_code];
                                    const resRate = dept.resolution_rate_pct ?? 0;
                                    return (
                                        <tr key={dept.department_code} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-glass)' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dept.color || '#6366f1', flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{deptInfo?.shortName || dept.department_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{deptInfo?.headTitle || '—'}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>{dept.total_complaints}</td>
                                            <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>{dept.active_count}</td>
                                            <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 600 }}>{dept.resolved_count}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{dept.sla_hours}h</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ color: resRate >= 80 ? '#22c55e' : resRate >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                                                    {resRate.toFixed(0)}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: dept.sla_breached_count > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: dept.sla_breached_count > 0 ? 700 : 400 }}>
                                                {dept.sla_breached_count}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Department contact cards */}
            <div style={{ marginTop: 32 }}>
                <h2 style={{ fontSize: 20, marginBottom: 16 }}>📞 Department Contacts</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {Object.values(DEPARTMENTS).map(dept => (
                        <div key={dept.code} style={{ padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Users size={16} color={dept.color} style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{dept.shortName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dept.email} · {dept.phone}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
