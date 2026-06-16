'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Map, AlertTriangle, CheckCircle } from 'lucide-react';
import { CATEGORY_LABELS, ZONE_LABELS, STATUS_LABELS, getStatusColor } from '@/lib/complaints';
import type { ComplaintCategory, CampusZone, ComplaintStatus } from '@/lib/complaints';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#22c55e', '#f97316', '#0ea5e9'];

export default function StudentComplaintAnalytics() {
    const [complaints, setComplaints] = useState<AnyRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/complaints?limit=200')
            .then(r => r.json())
            .then(d => {
                setComplaints(d.complaints ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    // Zone distribution
    const zoneData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c) => {
            const zone = c.zone as CampusZone;
            acc[zone] = (acc[zone] || 0) + 1;
            return acc;
        }, {})
    )
        .map(([zone, count]) => ({ name: ZONE_LABELS[zone as CampusZone] || zone, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    // Category distribution
    const categoryData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c) => {
            const cat = c.category as ComplaintCategory;
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {})
    )
        .map(([cat, count]) => ({ name: CATEGORY_LABELS[cat as ComplaintCategory] || cat, count }))
        .sort((a, b) => b.count - a.count);

    // Status distribution
    const statusData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {})
    ).map(([status, count]) => ({
        name: STATUS_LABELS[status as ComplaintStatus] || status,
        value: count,
        color: getStatusColor(status as ComplaintStatus),
    }));

    // Monthly trend (last 6 months)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        const count = complaints.filter(c => {
            const cd = new Date(c.created_at);
            return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
        }).length;
        return { month: label, complaints: count };
    });

    const totalResolved  = complaints.filter(c => c.status === 'RESOLVED').length;
    const totalEmergency = complaints.filter(c => c.is_emergency).length;
    const totalPending   = complaints.filter(c => ['PENDING_REVIEW', 'APPROVED'].includes(c.status)).length;
    const resolutionRate = complaints.length > 0 ? ((totalResolved / complaints.length) * 100).toFixed(0) : '0';

    return (
        <div>
            <div className="page-header">
                <h1>Campus Issue Analytics 📊</h1>
                <p>System-wide trends and insights from {complaints.length} submitted complaints.</p>
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Reported', value: complaints.length, icon: <TrendingUp size={20} />, color: '#6366f1' },
                    { label: 'Resolved', value: totalResolved, icon: <CheckCircle size={20} />, color: '#22c55e' },
                    { label: 'Pending', value: totalPending, icon: <AlertTriangle size={20} />, color: '#f59e0b' },
                    { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: <TrendingUp size={20} />, color: '#06b6d4' },
                    { label: 'Emergencies', value: totalEmergency, icon: <AlertTriangle size={20} />, color: '#ef4444' },
                ].map(kpi => (
                    <div key={kpi.label} className="stat-card">
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, color: kpi.color }}>
                            {kpi.icon}
                        </div>
                        <div className="stat-value" style={{ fontSize: 26 }}>{kpi.value}</div>
                        <div className="stat-label">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Monthly trend */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>📅 Monthly Complaint Trend</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                            <Bar dataKey="complaints" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Status pie */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>🔄 Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" labelLine={false}>
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category breakdown */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>📋 Issues by Category</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData} layout="vertical">
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                            {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Zone heatmap */}
            <div className="card" style={{ padding: 24 }}>
                <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Map size={18} /> Campus Zone Heatmap
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {zoneData.map((zone, i) => {
                        const maxCount = zoneData[0]?.value || 1;
                        const intensity = zone.value / maxCount;
                        return (
                            <div key={i} style={{
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: `rgba(99,102,241,${0.05 + intensity * 0.25})`,
                                border: `1px solid rgba(99,102,241,${0.1 + intensity * 0.4})`,
                            }}>
                                <div style={{ fontWeight: 700, fontSize: 22, color: '#6366f1', marginBottom: 4 }}>{zone.value}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{zone.name}</div>
                                <div style={{ marginTop: 8, height: 3, background: 'var(--bg-glass)', borderRadius: 2 }}>
                                    <div style={{ height: '100%', width: `${intensity * 100}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.5s' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
