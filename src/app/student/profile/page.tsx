'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Hash, Book, Star, Save, CheckCircle2, Music, Zap, Trophy, Shield, Cpu, Users } from 'lucide-react';

interface StudentData {
    id: string;
    rollNumber: string;
    department: string;
    year: number;
    rating: number;
    clubs: string[];
    user: { name: string; email: string };
}

const AVAILABLE_CLUBS = [
    { id: 'music', label: 'Music Club', icon: Music },
    { id: 'dance', label: 'Dance Academy', icon: Zap },
    { id: 'athletics', label: 'Athletics Team', icon: Trophy },
    { id: 'football', label: 'Football Club', icon: Zap },
    { id: 'cyber', label: 'Cyber Security', icon: Shield },
    { id: 'badminton', label: 'Badminton', icon: Zap },
    { id: 'basketball', label: 'Basketball', icon: Zap },
    { id: 'cricket', label: 'Cricket Club', icon: Zap },
    { id: 'coding', label: 'Coding Society', icon: Cpu },
    { id: 'robotics', label: 'Robotics', icon: Cpu },
];

export default function StudentProfile() {
    const router = useRouter();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user?.studentId) {
                    return fetch(`/api/students/${data.user.studentId}`);
                }
                throw new Error('No student ID');
            })
            .then(res => res.json())
            .then(data => {
                if (data.student) {
                    setStudent(data.student);
                    setSelectedClubs(data.student.clubs || []);
                }
                setLoading(false);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const toggleClub = (clubLabel: string) => {
        setSelectedClubs(prev => 
            prev.includes(clubLabel) 
                ? prev.filter(c => c !== clubLabel) 
                : [...prev, clubLabel]
        );
    };

    const handleSaveClubs = async () => {
        setSaving(true);
        setShowError('');
        try {
            const res = await fetch('/api/students/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clubs: selectedClubs })
            });
            if (res.ok) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Save clubs failed:', res.status, errData);
                setShowError(errData.details || errData.error || 'Failed to save. Please try again.');
                setTimeout(() => setShowError(''), 5000);
            }
        } catch (err) {
            console.error('Failed to save clubs:', err);
            setShowError('Network error. Please check your connection.');
            setTimeout(() => setShowError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !student) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>My Profile</h1>
                <p>Manage your identity and campus group memberships</p>
            </div>

            <div className="responsive-grid-dashboard">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                        <div className="student-avatar" style={{ width: 80, height: 80, fontSize: 28, margin: '0 auto 16px' }}>
                            {student.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <h2 style={{ marginBottom: 4 }}>{student.user.name}</h2>
                        <span className="badge badge-primary">{student.department}</span>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2>Academic Info</h2>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Hash size={16} color="var(--text-muted)" />
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Roll Number</div><div style={{ fontSize: 14, fontWeight: 600 }}>{student.rollNumber}</div></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Mail size={16} color="var(--text-muted)" />
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email</div><div style={{ fontSize: 14, fontWeight: 600 }}>{student.user.email}</div></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Book size={16} color="var(--text-muted)" />
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Year</div><div style={{ fontSize: 14, fontWeight: 600 }}>{student.year}</div></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Star size={16} color="var(--accent-emerald)" />
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rating</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-emerald)' }}>{student.rating} Points</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Users size={20} /> My Clubs & Societies
                            </h2>
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '8px 16px', fontSize: 13 }}
                                onClick={handleSaveClubs}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : showSuccess ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> Saved</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Save size={14} /> Save Changes</span>}
                            </button>
                        </div>
                        <div className="card-body">
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: showError ? 12 : 24 }}>
                                Select the clubs you are a part of. These will be displayed on your public campus profile.
                            </p>
                            {showError && (
                                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                                    ⚠️ {showError}
                                </div>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                {AVAILABLE_CLUBS.map(club => {
                                    const isSelected = selectedClubs.includes(club.label);
                                    return (
                                        <div 
                                            key={club.id}
                                            onClick={() => toggleClub(club.label)}
                                            style={{
                                                padding: '16px',
                                                borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12
                                            }}
                                            className="hover-scale-sm"
                                        >
                                            <div style={{ 
                                                width: 32, height: 32, borderRadius: 8, 
                                                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-glass-strong)',
                                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <club.icon size={16} />
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                {club.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
