'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Crown, Code2, GraduationCap, Heart, Sparkles, Github, ExternalLink } from 'lucide-react';
import PremiumBackground from '../components/PremiumBackground';

const TEAM = [
    {
        name: 'Harsh Kumar',
        roll: '25103063',
        role: 'Project Lead & Inventor',
        department: 'Computer Science & Engineering',
        isLeader: true,
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        shadowColor: 'rgba(245, 158, 11, 0.35)',
        description: 'Conceived, designed, and led the development of CampusNiti from the ground up — architecting the full-stack infrastructure, database schema, and all core features.',
    },
    {
        name: 'Hitesh',
        roll: '',
        role: 'Team Member',
        department: 'Mechanical Engineering',
        isLeader: false,
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        shadowColor: 'rgba(6, 182, 212, 0.35)',
        description: 'Contributed to system planning and cross-department workflow design for the maintenance management module.',
    },
    {
        name: 'Inderjeet',
        roll: '',
        role: 'Team Member',
        department: 'Electronics & Communication Engineering',
        isLeader: false,
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        shadowColor: 'rgba(139, 92, 246, 0.35)',
        description: 'Assisted in system testing and IoT integration planning for smart campus infrastructure monitoring.',
    },
    {
        name: 'Hemant Kumar',
        roll: '',
        role: 'Team Member',
        department: 'Computer Science & Engineering',
        isLeader: false,
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        shadowColor: 'rgba(16, 185, 129, 0.35)',
        description: 'Contributed to the frontend design discussions and student-facing feature ideation for the complaint module.',
    },
];

const FACULTY_MENTOR = {
    name: 'Dr. Urvashi',
    designation: 'Faculty Mentor',
    department: 'Computer Science & Engineering',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    shadowColor: 'rgba(236, 72, 153, 0.35)',
};

export default function AboutPage() {
    const router = useRouter();

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <PremiumBackground />
            <div style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '40px 20px 80px',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-secondary, #94a3b8)',
                        padding: '8px 16px', borderRadius: 20,
                        cursor: 'pointer', fontSize: 14, fontWeight: 500,
                        marginBottom: 32, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#94a3b8';
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Hero Section */}
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
                    }}>
                        <Shield size={32} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 800,
                        margin: '0 0 8px',
                        background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                    }}>
                        CampusNiti
                    </h1>
                    <p style={{
                        color: '#94a3b8', fontSize: 16, margin: '0 0 4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <Sparkles size={14} color="#6366f1" />
                        Student Discipline & Campus Infrastructure Management System
                        <Sparkles size={14} color="#6366f1" />
                    </p>
                    <div style={{
                        width: 120, height: 2,
                        background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                        margin: '20px auto 0',
                    }} />
                </div>

                {/* Faculty Mentor Section */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: '#ec4899', fontSize: 12, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: 2,
                        marginBottom: 16,
                    }}>
                        <GraduationCap size={16} />
                        Faculty Mentor & Guide
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(236, 72, 153, 0.25)',
                        borderRadius: 20,
                        padding: '28px 32px',
                        maxWidth: 480,
                        margin: '0 auto',
                        backdropFilter: 'blur(12px)',
                        boxShadow: `0 8px 32px ${FACULTY_MENTOR.shadowColor}`,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: FACULTY_MENTOR.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 14px',
                            fontSize: 22, fontWeight: 700, color: 'white',
                            boxShadow: `0 8px 24px ${FACULTY_MENTOR.shadowColor}`,
                        }}>
                            {FACULTY_MENTOR.name.split(' ').filter(n => n.length > 1).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
                            {FACULTY_MENTOR.name}
                        </h2>
                        <p style={{ margin: '0 0 4px', color: '#ec4899', fontWeight: 600, fontSize: 14 }}>
                            {FACULTY_MENTOR.designation}
                        </p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
                            Department of {FACULTY_MENTOR.department}
                        </p>
                    </div>
                </div>

                {/* Development Team Section */}
                <div style={{ marginBottom: 48 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#6366f1', fontSize: 12, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: 2,
                            marginBottom: 8,
                        }}>
                            <Code2 size={16} />
                            Development Team
                        </div>
                    </div>

                    {/* Leader Card — Full Width */}
                    {TEAM.filter(m => m.isLeader).map(member => (
                        <div key={member.name} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: 20,
                            padding: '32px',
                            marginBottom: 20,
                            backdropFilter: 'blur(12px)',
                            boxShadow: `0 8px 32px ${member.shadowColor}`,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Leader badge */}
                            <div style={{
                                position: 'absolute', top: 16, right: 16,
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '4px 12px', borderRadius: 20,
                                fontSize: 11, fontWeight: 700, color: '#f59e0b',
                                textTransform: 'uppercase', letterSpacing: 1,
                            }}>
                                <Crown size={12} /> Project Leader
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: member.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0,
                                    boxShadow: `0 8px 24px ${member.shadowColor}`,
                                }}>
                                    HK
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <h3 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
                                        {member.name}
                                    </h3>
                                    {member.roll && (
                                        <span style={{
                                            display: 'inline-block',
                                            background: 'rgba(245, 158, 11, 0.12)',
                                            border: '1px solid rgba(245, 158, 11, 0.25)',
                                            color: '#f59e0b', fontSize: 12, fontWeight: 600,
                                            padding: '2px 10px', borderRadius: 12,
                                            marginBottom: 6,
                                        }}>
                                            {member.roll}
                                        </span>
                                    )}
                                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
                                        {member.description}
                                    </p>
                                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                                        Dept. of {member.department}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Other Team Members — Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 16,
                    }}>
                        {TEAM.filter(m => !m.isLeader).map(member => (
                            <div key={member.name} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: '24px',
                                backdropFilter: 'blur(12px)',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = `0 12px 32px ${member.shadowColor}`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                                <div style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    background: member.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18, fontWeight: 700, color: 'white',
                                    marginBottom: 14,
                                    boxShadow: `0 6px 16px ${member.shadowColor}`,
                                }}>
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                                    {member.name}
                                </h4>
                                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                                    {member.department}
                                </p>
                                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                                    {member.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div style={{
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '28px 24px',
                    marginBottom: 48,
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
                        Built With
                    </h3>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10,
                    }}>
                        {['Next.js 15', 'React 19', 'TypeScript', 'Supabase', 'PostgreSQL', 'Web Push API', 'Lucide Icons', 'Zod'].map(tech => (
                            <span key={tech} style={{
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                color: '#a5b4fc', fontSize: 13, fontWeight: 500,
                                padding: '5px 14px', borderRadius: 20,
                            }}>
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', color: '#475569', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                        Made with <Heart size={13} color="#ef4444" fill="#ef4444" /> for our Campus
                    </div>
                    <p style={{ margin: 0 }}>
                        © {new Date().getFullYear()} CampusNiti · All Rights Reserved
                    </p>
                </div>
            </div>
        </div>
    );
}
