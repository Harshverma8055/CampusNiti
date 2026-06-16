'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, MapPin, GraduationCap, Award, Users, ArrowLeft } from 'lucide-react';

interface PublicStudent {
    id: string;
    name: string;
    avatarUrl?: string;
    rollNumber: string;
    department: string;
    year: number;
    clubs: string[];
    achievements: Array<{
        id: string;
        title: string;
        description: string;
        badgeIcon: string;
        awardedAt: string;
    }>;
}

export default function PublicStudentProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<PublicStudent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/students/public/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.student) {
                    setStudent(data.student);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }

    if (!student) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                <h3>Student not found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This profile may be private or does not exist.</p>
                <button className="btn btn-primary" onClick={() => router.back()} style={{ marginTop: 24 }}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div>
            <button className="btn btn-outline" onClick={() => router.back()} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
                    <div className="student-avatar" style={{ width: 100, height: 100, fontSize: 36, margin: '0 auto 24px' }}>
                        {(student.name || 'Unknown').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <h1 style={{ marginBottom: 8 }}>{student.name || 'Unknown'}</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={16} /> {student.rollNumber || 'N/A'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {student.department || 'N/A'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={16} /> Year {Number.isNaN(student.year) ? 'N/A' : (student.year || 'N/A')}</div>
                    </div>
                </div>
            </div>

            <div className="responsive-grid-half">
                {/* Clubs Section */}
                <div className="card">
                    <div className="card-header">
                        <h2><Users size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Clubs & Societies</h2>
                    </div>
                    <div className="card-body">
                        {student.clubs && student.clubs.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {student.clubs.map((club) => (
                                    <div key={club} style={{ 
                                        padding: '10px 16px', 
                                        background: 'var(--bg-glass)', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                        {club}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Users size={32} />
                                <p>No club memberships listed yet.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
}
