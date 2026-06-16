'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import type { ComplaintListItem, ComplaintStatus, ComplaintCategory, CampusZone } from '@/lib/complaints';
import { CATEGORY_LABELS, ZONE_LABELS } from '@/lib/complaints';

type Tab = 'trending' | 'my' | 'all';

export default function StudentComplaintsPage() {
    const router = useRouter();
    const [tab, setTab]                 = useState<Tab>('trending');
    const [complaints, setComplaints]   = useState<ComplaintListItem[]>([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filterZone, setFilterZone]   = useState('');
    const [filterCat, setFilterCat]     = useState('');
    const [emergencies, setEmergencies] = useState<ComplaintListItem[]>([]);

    const load = useCallback(async (t: Tab) => {
        setLoading(true);
        try {
            let url = '/api/complaints?sort=priority&limit=20';
            if (t === 'my') url += '&status=';     // will include own regardless
            if (t === 'trending') url = '/api/complaints/trending?limit=15';
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filterZone) url += `&zone=${filterZone}`;
            if (filterCat)  url += `&category=${filterCat}`;

            const res = await fetch(url);
            const data = await res.json();
            setComplaints(t === 'trending' ? (data.trending ?? []) : (data.complaints ?? []));
        } finally {
            setLoading(false);
        }
    }, [search, filterZone, filterCat]);

    useEffect(() => { load(tab); }, [tab, load]);

    // Load emergency alerts separately
    useEffect(() => {
        fetch('/api/complaints?sort=priority&limit=5&priority=EMERGENCY')
            .then(r => r.json())
            .then(d => setEmergencies(d.complaints ?? []));
    }, []);

    async function handleVote(id: string) {
        const res = await fetch(`/api/complaints/${id}/vote`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            setComplaints(prev => prev.map(c =>
                c.id === id
                    ? { ...c, has_voted: data.voted, upvote_count: data.upvote_count }
                    : c
            ));
        }
    }

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'trending', label: 'Trending', icon: <TrendingUp size={15} /> },
        { key: 'all',      label: 'All Issues', icon: <Search size={15} /> },
        { key: 'my',       label: 'My Complaints', icon: <Clock size={15} /> },
    ];

    const selectStyle = {
        padding: '8px 12px', background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
    };

    return (
        <div>
            {/* Emergency Banner */}
            {emergencies.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    borderRadius: 'var(--radius-md)', padding: '14px 20px',
                    marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
                }}>
                    <AlertTriangle size={22} color="white" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>
                            🚨 {emergencies.length} ACTIVE EMERGENCY ISSUE{emergencies.length > 1 ? 'S' : ''} ON CAMPUS
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                            {emergencies[0].title} — {emergencies[0].zone.replace(/_/g, ' ')}
                        </div>
                    </div>
                    <Link href={`/student/complaints/${emergencies[0].id}`}
                        style={{ background: 'white', color: '#dc2626', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        View →
                    </Link>
                </div>
            )}

            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1>Campus Issues 🏗️</h1>
                    <p>Report, upvote, and track infrastructure problems at NIT Jalandhar</p>
                </div>
                <Link href="/student/complaints/new"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <Plus size={18} /> Report Issue
                </Link>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', padding: 6, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                            background: tab === t.key ? 'var(--accent-primary)' : 'transparent',
                            color: tab === t.key ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: tab === t.key ? 700 : 400,
                            fontSize: 13, transition: 'all 0.2s',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            {tab !== 'my' && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ ...selectStyle, paddingLeft: 32, width: '100%' }}
                            placeholder="Search complaints..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && load(tab)}
                        />
                    </div>
                    <select style={selectStyle} value={filterZone} onChange={e => { setFilterZone(e.target.value); }}>
                        <option value="">All Zones</option>
                        {(Object.entries(ZONE_LABELS) as [CampusZone, string][]).map(([k, v]) =>
                            <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select style={selectStyle} value={filterCat} onChange={e => { setFilterCat(e.target.value); }}>
                        <option value="">All Categories</option>
                        {(Object.entries(CATEGORY_LABELS) as [ComplaintCategory, string][]).map(([k, v]) =>
                            <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button
                        onClick={() => load(tab)}
                        style={{ ...selectStyle, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Filter size={14} /> Apply
                    </button>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 16 }}>
                        {tab === 'my' ? "You haven't reported any issues yet." : 'No complaints found.'}
                    </p>
                    {tab === 'my' && (
                        <Link href="/student/complaints/new" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 16 }}>
                            Report Your First Issue
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {complaints.map(c => (
                        <ComplaintCard
                            key={c.id}
                            complaint={c}
                            onVote={handleVote}
                            onClick={id => router.push(`/student/complaints/${id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
