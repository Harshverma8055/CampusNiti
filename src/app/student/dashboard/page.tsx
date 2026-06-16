'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Award, Star, Trophy, Medal, AlertTriangle, ShieldAlert, Vote } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import AnnouncementCard from '../../components/AnnouncementCard';

interface StudentData {
    id: string;
    rollNumber: string;
    department: string;
    year: number;
    rating: number;
    qrCode?: string | null;
    user: { name: string; email: string };
    ratingLogs: Array<{
        id: string;
        pointChange: number;
        reason: string;
        category: string;
        createdAt: string;
        faculty: { user: { name: string } };
    }>;
    achievements: Array<{
        id: string;
        title: string;
        description: string;
        badgeIcon: string;
        awardedAt: string;
    }>;
    criticalIncidents: Array<{
        id: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        fineAmount: number | null;
        escalatedTo: string | null;
        status: string;
        createdAt: string;
        faculty: { user: { name: string } };
    }>;
}

interface RankedStudent {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    rating: number;
    rank: number;
    hasPendingInquiry?: boolean;
}



interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
    isUrgent: boolean;
    createdAt: string;
    author: { name: string };
}

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [totalStudents, setTotalStudents] = useState(0);
    const [topThree, setTopThree] = useState<RankedStudent[]>([]);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [unvotedPolls, setUnvotedPolls] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user?.studentId) {
                    return Promise.all([
                        fetch(`/api/students/${data.user.studentId}`).then(r => r.json()),
                        fetch('/api/students/rankings').then(r => r.json()),
                        fetch('/api/announcements').then(r => r.json()),
                        fetch('/api/polls?status=ACTIVE').then(r => r.json()),
                    ]).then(([studentData, rankingsData, announcementsData, pollsData]) => {
                        if (studentData.student) setStudent(studentData.student);
                        if (rankingsData.rankings) {
                            const rankings: RankedStudent[] = rankingsData.rankings;
                            setTotalStudents(rankings.length);
                            setTopThree(rankings.slice(0, 3));
                            const me = rankings.find((r: RankedStudent) => r.id === data.user.studentId);
                            if (me) setMyRank(me.rank);
                        }

                        if (announcementsData.announcements) setAnnouncements(announcementsData.announcements);
                        if (pollsData.polls) {
                            setUnvotedPolls(pollsData.polls.filter((p: Record<string, unknown>) => !p.myVoteOptionId));
                        }
                        setLoading(false);
                    });
                }
                throw new Error('No student ID');
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    if (loading || !student) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
            </div>
        );
    }

    // Calculate chart data
    const sortedLogs = [...student.ratingLogs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let runningRating = 100;
    const chartData = [{ date: 'Start', rating: 100 }];
    sortedLogs.forEach(log => {
        runningRating += log.pointChange;
        chartData.push({
            date: new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            rating: runningRating,
        });
    });

    const positiveChanges = student.ratingLogs.filter(l => l.pointChange > 0).length;
    const negativeChanges = student.ratingLogs.filter(l => l.pointChange < 0).length;

    const getRankBadge = (rating: number) => {
        if (rating >= 150) return { label: 'Outstanding', color: 'var(--accent-emerald)', icon: '🏆' };
        if (rating >= 120) return { label: 'Excellent', color: 'var(--accent-primary)', icon: '⭐' };
        if (rating >= 100) return { label: 'Good', color: 'var(--accent-sky)', icon: '👍' };
        if (rating >= 80) return { label: 'Average', color: 'var(--accent-amber)', icon: '📊' };
        return { label: 'Needs Improvement', color: 'var(--accent-rose)', icon: '⚠️' };
    };

    const rank = getRankBadge(student.rating);
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const medalLabels = ['🥇', '🥈', '🥉'];

    const pendingIncidents = student.criticalIncidents ? student.criticalIncidents.filter(ci => ci.status === 'PENDING') : [];
    const hasPendingInquiry = pendingIncidents.length > 0;

    if (hasPendingInquiry && !hasAgreedDisclaimer) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 24, backdropFilter: 'blur(10px)'
            }}>
                <div className="card" style={{ maxWidth: 600, width: '100%', padding: '40px 32px', border: '2px solid var(--accent-rose)', boxShadow: '0 20px 40px rgba(244,63,94,0.3)', textAlign: 'center' }}>
                    <div style={{ background: 'var(--accent-rose)', color: 'white', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <ShieldAlert size={32} />
                    </div>
                    <h2 style={{ fontSize: 24, marginBottom: 12, color: 'white' }}>Official Disciplinary Notice</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 16, lineHeight: 1.6 }}>
                        You have <strong>{pendingIncidents.length} pending academic inquiry/warning(s)</strong> that require your immediate attention. Access to your full dashboard is restricted until you acknowledge this notice.
                    </p>
                    <div style={{ background: 'rgba(244,63,94,0.1)', padding: 16, borderRadius: 8, marginBottom: 32, textAlign: 'left', border: '1px solid rgba(244,63,94,0.2)' }}>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
                            By clicking &quot;I Agree&quot;, you acknowledge that you have been officially notified of this ongoing disciplinary action and understand it is your responsibility to coordinate with the relevant faculty to resolve it.
                        </p>
                    </div>
                    <button className="btn" style={{ background: 'var(--accent-rose)', color: 'white', width: '100%', padding: 16, fontSize: 16, fontWeight: 700 }} onClick={() => setHasAgreedDisclaimer(true)}>
                        I ACKNOWLEDGE & AGREE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {hasPendingInquiry && hasAgreedDisclaimer && (
                <div style={{ background: 'var(--accent-rose)', color: 'white', padding: '12px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(244,63,94,0.2)' }}>
                    <ShieldAlert size={20} />
                    <div>
                        <strong style={{ display: 'block', fontSize: 14 }}>ACTIVE INQUIRY PENDING</strong>
                        <span style={{ fontSize: 13, opacity: 0.9 }}>You have an unresolved disciplinary incident. Please resolve this with your faculty immediately.</span>
                    </div>
                </div>
            )}
            <div className="page-header">
                <h1>Welcome, {student.user.name.split(' ')[0]}! 👋</h1>
                <p>Here&apos;s your discipline rating overview</p>
            </div>

            {/* Unvoted Polls Alert */}
            {unvotedPolls.length > 0 && (
                <div className="card" style={{ marginBottom: 32, padding: 20, borderLeft: '4px solid var(--accent-primary)', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: 'var(--accent-primary)', color: 'white', padding: 12, borderRadius: '50%', display: 'flex' }}>
                            <Vote size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: 18, fontWeight: 700 }}>New Voting Available!</h3>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                                You have {unvotedPolls.length} active voting session{unvotedPolls.length !== 1 ? 's' : ''} waiting for your response.
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => router.push('/student/polls')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Vote size={18} />
                        Cast Your Vote
                    </button>
                </div>
            )}

            {/* Rating Circle + Streak + Chart */}
            <div className="responsive-grid-dashboard">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Rating Circle */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="rating-display">
                            <div className="rating-circle">
                                <div className="rating-inner">
                                    <div className="score">{student.rating}</div>
                                    <div className="label">Rating</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 20 }}>
                            <span style={{ fontSize: 24, marginRight: 8 }}>{rank.icon}</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: rank.color }}>{rank.label}</span>
                        </div>
                    </div>


                    {/* QR Code */}
                    {student.qrCode && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
                            <h3 style={{ marginBottom: 16, fontSize: 16 }}>My QR Code</h3>
                            <img src={student.qrCode} alt="Student QR Code" style={{ width: '100%', maxWidth: 200, borderRadius: 8, background: 'white', padding: 8 }} />
                        </div>
                    )}
                </div>

                {/* Rating Chart */}
                <div className="card">
                    <div className="card-header">
                        <h2>Rating Trend</h2>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rating"
                                    stroke="var(--accent-primary)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--accent-primary)', r: 5 }}
                                    activeDot={{ r: 7, fill: 'var(--accent-secondary)' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>



            {/* Danger Zone: Critical Incidents */}
            {student.criticalIncidents && student.criticalIncidents.length > 0 && (
                <div className="card" style={{ marginBottom: 32, border: '1px solid var(--accent-rose)' }}>
                    <div className="card-header" style={{ borderBottom: '1px solid rgba(244, 63, 94, 0.2)', paddingBottom: '16px' }}>
                        <h2 style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={20} /> Danger Zone: Critical Warnings & Fines
                        </h2>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {student.criticalIncidents.map(incident => (
                                <div key={incident.id} style={{
                                    background: 'rgba(244, 63, 94, 0.05)',
                                    border: `1px solid ${incident.severity === 'CRITICAL' ? 'var(--accent-rose)' : 'rgba(244, 63, 94, 0.3)'}`,
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {incident.severity === 'CRITICAL' ? <AlertTriangle size={18} color="var(--accent-rose)" /> : null}
                                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>{incident.title}</h3>
                                            <span className={`badge ${incident.type === 'FINE' ? 'badge-rose' : 'badge-amber'}`}>
                                                {incident.type === 'FINE' ? `FINE: ₹${incident.fineAmount}` : incident.status === 'RESOLVED' ? 'ACTION RECORDED' : 'PENDING INQUIRY'}
                                            </span>
                                            {incident.status === 'RESOLVED' && <span className="badge badge-category" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>RESOLVED</span>}
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ marginTop: '12px', fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                        {incident.description}
                                    </p>
                                    <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                                        <span>Reported by: <strong>{incident.faculty.user.name}</strong></span>
                                        {incident.escalatedTo && <span>Escalated to: <strong>{incident.escalatedTo}</strong></span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon purple"><Star size={20} /></div>
                    <div className="stat-value">{student.rating}</div>
                    <div className="stat-label">Current Rating</div>
                </div>
                <div className="stat-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div className="stat-icon amber"><Trophy size={20} /></div>
                    <div className="stat-value">#{myRank || '—'}</div>
                    <div className="stat-label">Your Rank (of {totalStudents})</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon emerald"><TrendingUp size={20} /></div>
                    <div className="stat-value">{positiveChanges}</div>
                    <div className="stat-label">Positive Reviews</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon rose"><TrendingDown size={20} /></div>
                    <div className="stat-value">{negativeChanges}</div>
                    <div className="stat-label">Negative Reviews</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><Award size={20} /></div>
                    <div className="stat-value">{student.achievements.length}</div>
                    <div className="stat-label">Achievements</div>
                </div>
            </div>

            {/* Announcements */}
            <div className="card" style={{ marginBottom: 32 }}>
                <AnnouncementCard announcements={announcements} />
            </div>

            {/* Top 3 Leaderboard */}
            {topThree.length > 0 && (
                <div className="card" style={{ marginBottom: 32 }}>
                    <div className="card-header">
                        <h2><Medal size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Top 3 Students</h2>
                    </div>
                    <div className="card-body">
                        <div className="responsive-grid-thirds">
                            {topThree.map((s, i) => (
                                <div key={s.id} style={{
                                    background: s.id === student.id
                                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))'
                                        : 'var(--bg-glass)',
                                    border: s.id === student.id
                                        ? '2px solid var(--accent-primary)'
                                        : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 24,
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>{medalLabels[i]}</div>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${medalColors[i]}, ${medalColors[i]}88)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px', fontWeight: 800, fontSize: 20, color: '#1a1a2e'
                                    }}>
                                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
                                    {s.hasPendingInquiry && (
                                        <div style={{
                                            background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', 
                                            borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                                            border: '1px solid rgba(244,63,94,0.2)', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4
                                        }}>
                                            <ShieldAlert size={10} /> UNDER INQUIRY
                                        </div>
                                    )}
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        {s.rollNumber} • {s.department}
                                    </div>
                                    <div style={{
                                        fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800,
                                        color: medalColors[i],
                                    }}>
                                        {s.rating}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>points</div>
                                    {s.id === student.id && (
                                        <div style={{
                                            marginTop: 8, fontSize: 11, fontWeight: 600,
                                            color: 'var(--accent-primary)',
                                            textTransform: 'uppercase', letterSpacing: 1,
                                        }}>
                                            ✨ That&apos;s you!
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Achievements */}
            {student.achievements.length > 0 && (
                <div className="card" style={{ marginBottom: 32 }}>
                    <div className="card-header">
                        <h2>My Achievements</h2>
                    </div>
                    <div className="card-body">
                        <div className="achievements-grid">
                            {student.achievements.map(a => (
                                <div key={a.id} className="achievement-card">
                                    <div className="achievement-icon">{a.badgeIcon}</div>
                                    <div className="achievement-title">{a.title}</div>
                                    <div className="achievement-desc">{a.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">
                    <h2>Recent Activity</h2>
                </div>
                <div className="card-body">
                    <div className="timeline">
                        {student.ratingLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="timeline-item">
                                <div className={`timeline-dot ${log.pointChange > 0 ? 'positive' : 'negative'}`}>
                                    {log.pointChange > 0 ? '↑' : '↓'}
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className={`timeline-points ${log.pointChange > 0 ? 'positive' : 'negative'}`}
                                            style={{ color: log.pointChange > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                            {log.pointChange > 0 ? '+' : ''}{log.pointChange} points
                                        </span>
                                        <span className="timeline-date">
                                            {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="timeline-reason">{log.reason}</div>
                                    <div className="timeline-faculty">
                                        <span className="badge badge-category" style={{ marginRight: 8 }}>{log.category}</span>
                                        By: {log.faculty.user.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
