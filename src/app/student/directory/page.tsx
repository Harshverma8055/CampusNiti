'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, MapPin, GraduationCap, ArrowRight, Star, Trophy, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    year: number;
    rating: number;
    achievementCount: number;
    avatarUrl?: string;
}

const DEPARTMENTS = [
    'Biotechnology', 'Chemical Engineering', 'Civil Engineering',
    'Computer Science and Engineering', 'Data Science and Engineering',
    'Electrical Engineering', 'Electronics and Communication Engineering',
    'Industrial and Production Engineering', 'Information Technology',
    'Instrumentation and Control Engineering', 'Mathematics and Computing',
    'Mechanical Engineering', 'Textile Technology',
];

const DEPT_SHORT: Record<string, string> = {
    'Computer Science and Engineering': 'CSE',
    'Electronics and Communication Engineering': 'ECE',
    'Electrical Engineering': 'EE',
    'Mechanical Engineering': 'ME',
    'Civil Engineering': 'CE',
    'Information Technology': 'IT',
    'Data Science and Engineering': 'DSE',
    'Biotechnology': 'BT',
    'Chemical Engineering': 'ChE',
    'Industrial and Production Engineering': 'IPE',
    'Instrumentation and Control Engineering': 'ICE',
    'Mathematics and Computing': 'MnC',
    'Textile Technology': 'TT',
};

function getRatingColor(rating: number) {
    if (rating >= 90) return 'var(--accent-emerald)';
    if (rating >= 70) return 'var(--accent-primary)';
    if (rating >= 50) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
}

function StudentCard({ s }: { s: Student }) {
    const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const deptShort = DEPT_SHORT[s.department] || s.department.slice(0, 4).toUpperCase();

    return (
        <Link href={`/student/profile/${s.rollNumber}`} style={{ textDecoration: 'none' }}>
            <div className="card hover-scale-sm" style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', height: '100%' }}>
                <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
                    <div className="student-avatar" style={{ margin: '0 auto 14px', width: 60, height: 60, fontSize: 22 }}>
                        {initials}
                    </div>
                    <h3 style={{ marginBottom: 6, fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{s.name}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <User size={12} /> {s.rollNumber}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}>
                            <span className="badge badge-primary" style={{ fontSize: 11 }}>{deptShort}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                                <GraduationCap size={12} /> Year {s.year}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: getRatingColor(s.rating) }}>{s.rating}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Star size={10} /> Rating</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: s.achievementCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{s.achievementCount}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Trophy size={10} /> Awards</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        View Profile <ArrowRight size={12} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function StudentDirectory() {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [browseStudents, setBrowseStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [browseLoading, setBrowseLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 24;

    const loadBrowse = useCallback(async (dept: string, year: string, pg: number) => {
        setBrowseLoading(true);
        try {
            const params = new URLSearchParams({ browse: 'true', page: String(pg) });
            if (dept) params.set('dept', dept);
            if (year) params.set('year', year);
            const res = await fetch(`/api/students/search?${params}`);
            const data = await res.json();
            setBrowseStudents(data.students || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Browse failed:', err);
        } finally {
            setBrowseLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBrowse(selectedDept, selectedYear, page);
    }, [selectedDept, selectedYear, page, loadBrowse]);

    useEffect(() => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSearchResults(data.students || []);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const totalPages = Math.ceil(total / LIMIT);
    const isSearching = query.length >= 2;

    return (
        <div>
            <div className="page-header">
                <h1>🎓 Campus Student Directory</h1>
                <p>Browse and discover your peers across all departments</p>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body">
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or roll number..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ paddingLeft: 48, paddingRight: query ? 48 : 16, height: 52, fontSize: 15 }}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Results */}
            {isSearching ? (
                loading ? (
                    <div className="loading-container"><div className="spinner" /></div>
                ) : searchResults.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <h3>No students found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>We couldn&apos;t find anyone matching &quot;{query}&quot;</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
                        <div className="responsive-grid-auto">
                            {searchResults.map(s => <StudentCard key={s.id} s={s} />)}
                        </div>
                    </>
                )
            ) : (
                /* Browse All */
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        <MapPin size={16} color="var(--text-muted)" />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                className={`btn ${selectedDept === '' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => { setSelectedDept(''); setPage(1); }}
                            >All Depts</button>
                            {DEPARTMENTS.map(d => (
                                <button
                                    key={d}
                                    className={`btn ${selectedDept === d ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: 12, padding: '6px 14px' }}
                                    onClick={() => { setSelectedDept(d); setPage(1); }}
                                >
                                    {DEPT_SHORT[d] || d.slice(0, 4)}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                            {['', '1', '2', '3', '4'].map(y => (
                                <button
                                    key={y}
                                    className={`btn ${selectedYear === y ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: 12, padding: '6px 12px' }}
                                    onClick={() => { setSelectedYear(y); setPage(1); }}
                                >
                                    {y === '' ? 'All Years' : `Year ${y}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {browseLoading ? (
                        <div className="loading-container"><div className="spinner" /></div>
                    ) : browseStudents.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                            <h3>No students found</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Try changing the filters above.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of <strong>{total}</strong> students
                                </p>
                            </div>
                            <div className="responsive-grid-auto">
                                {browseStudents.map(s => <StudentCard key={s.id} s={s} />)}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </button>
                                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
