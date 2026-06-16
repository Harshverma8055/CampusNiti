'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DeptStat { name: string; count: number; avgRating: number; }
interface YearStat { year: number; count: number; avgRating: number; }
interface Performer { id: string; name: string; rollNumber: string; department: string; rating: number; }
interface IncidentTrend { month: string; count: number; }
interface FacultyActivity { name: string; count: number; }

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#06b6d4', '#84cc16', '#e11d48'];

export default function AdminAnalytics() {
    const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
    const [yearStats, setYearStats] = useState<YearStat[]>([]);
    const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
    const [bottomPerformers, setBottomPerformers] = useState<Performer[]>([]);
    const [incidentTrends, setIncidentTrends] = useState<IncidentTrend[]>([]);
    const [facultyActivity, setFacultyActivity] = useState<FacultyActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then(res => res.json())
            .then(data => {
                if (data.departmentStats) setDeptStats(data.departmentStats);
                if (data.yearStats) setYearStats(data.yearStats);
                if (data.topPerformers) setTopPerformers(data.topPerformers);
                if (data.bottomPerformers) setBottomPerformers(data.bottomPerformers);
                if (data.incidentTrends) setIncidentTrends(data.incidentTrends);
                if (data.facultyActivity) setFacultyActivity(data.facultyActivity);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-container"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p></div>;
    }

    const yearLabels: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };

    return (
        <div>
            <div className="page-header">
                <h1><BarChart3 size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />Analytics & Reports</h1>
                <p>Department-wise statistics, trends, and performance data</p>
            </div>

            {/* Department Bar Chart + Year Wise */}
            <div className="responsive-grid-2-1" style={{ marginBottom: 32 }}>
                <div className="card">
                    <div className="card-header"><h2>Students per Department</h2></div>
                    <div className="card-body" style={{ height: 350 }}>
                        {deptStats.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 80 }}>No data</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptStats.map(d => ({ ...d, shortName: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="shortName" stroke="var(--text-muted)" fontSize={10} angle={-30} textAnchor="end" height={80} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2>Year-wise Avg Rating</h2></div>
                    <div className="card-body">
                        {yearStats.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>No data</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {yearStats.map(y => (
                                    <div key={y.year} style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{yearLabels[y.year] || `Year ${y.year}`}</span>
                                            <span className="badge badge-category">{y.count} students</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 8, background: 'var(--bg-glass-strong)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${Math.min(y.avgRating, 150) / 1.5}%`, background: y.avgRating >= 90 ? 'var(--accent-emerald)' : y.avgRating >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)', borderRadius: 4 }} />
                                            </div>
                                            <span style={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: 20, color: y.avgRating >= 90 ? 'var(--accent-emerald)' : y.avgRating >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{y.avgRating}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top & Bottom Performers */}
            <div className="responsive-grid-half">
                <div className="card">
                    <div className="card-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} style={{ color: 'var(--accent-emerald)' }} /> Top Performers</h2></div>
                    <div style={{ overflowX: 'auto' }}>
                        <div className="data-table-wrapper"><table className="data-table">
                            <thead><tr><th>#</th><th>Name</th><th>Roll No.</th><th>Rating</th></tr></thead>
                            <tbody>
                                {topPerformers.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 700, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td><span className="badge badge-category">{s.rollNumber}</span></td>
                                        <td><span className="badge badge-positive">{s.rating}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingDown size={18} style={{ color: 'var(--accent-rose)' }} /> Needs Improvement</h2></div>
                    <div style={{ overflowX: 'auto' }}>
                        <div className="data-table-wrapper"><table className="data-table">
                            <thead><tr><th>#</th><th>Name</th><th>Roll No.</th><th>Rating</th></tr></thead>
                            <tbody>
                                {bottomPerformers.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td><span className="badge badge-category">{s.rollNumber}</span></td>
                                        <td><span className="badge badge-negative">{s.rating}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </div>
            </div>

            {/* Incident Trends & Faculty Activity */}
            <div className="responsive-grid-half">
                <div className="card">
                    <div className="card-header"><h2><AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Incident Trends</h2></div>
                    <div className="card-body" style={{ height: 280 }}>
                        {incidentTrends.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>No incidents recorded yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={incidentTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                    <Line type="monotone" dataKey="count" stroke="var(--accent-rose)" strokeWidth={2} dot={{ fill: 'var(--accent-rose)', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2><Award size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Faculty Activity</h2></div>
                    <div className="card-body">
                        {facultyActivity.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>No ratings given yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {facultyActivity.map((f, i) => {
                                    const maxCount = facultyActivity[0]?.count || 1;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.name}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>{f.count} ratings</span>
                                            </div>
                                            <div style={{ height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(f.count / maxCount) * 100}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`, borderRadius: 3 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
