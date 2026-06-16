'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, ClipboardList, LogOut, Menu, X, Wrench, User, Mail, Hash, BookOpen, Info } from 'lucide-react';
import PremiumBackground from '../components/PremiumBackground';
export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
    const router   = useRouter();
    const pathname = usePathname();
    const [user, setUser]             = useState<{ name: string; email: string; maintenanceDept?: string; staffCode?: string; specialization?: string[] } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [assignedCount, setAssignedCount] = useState(0);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (d.user && (d.user.role === 'MAINTENANCE' || d.user.role === 'ADMIN')) {
                setUser(d.user);
                const deptParam = d.user.maintenanceDept ? `&department=${encodeURIComponent(d.user.maintenanceDept)}` : '';
                fetch(`/api/complaints?status=ASSIGNED${deptParam}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.complaints) {
                            setAssignedCount(data.complaints.length);
                        }
                    })
                    .catch(() => {});
            }
            else router.push('/login');
        }).catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const navItems = [
        { href: '/maintenance/dashboard', label: 'My Queue', icon: LayoutDashboard, badge: assignedCount },
        { href: '/maintenance/history',   label: 'Resolved History', icon: ClipboardList, badge: 0 },
        { href: '/about',                 label: 'About Project', icon: Info, badge: 0 },
    ];

    if (!user) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div className="dashboard-layout">
            <PremiumBackground />
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                        <Wrench size={18} color="white" />
                    </div>
                    <div>
                        <h2>CampusNiti</h2>
                        <span style={{ color: '#06b6d4' }}>Maintenance Panel</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href}
                            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <item.icon size={20} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge > 0 && (
                                <span style={{
                                    background: '#ef4444', color: 'white', borderRadius: 999,
                                    padding: '2px 7px', fontSize: 10, fontWeight: 700, minWidth: 18,
                                    textAlign: 'center', lineHeight: '14px',
                                }}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div 
                        className="user-info" 
                        onClick={() => setShowProfileModal(true)}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '8px', borderRadius: '8px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="user-details">
                            <div className="name">{user.name}</div>
                            <div className="role" style={{ color: '#06b6d4', fontSize: '0.8rem' }}>
                                {user.maintenanceDept ? user.maintenanceDept.replace(/_/g, ' ') : 'Maintenance Staff'}
                            </div>
                        </div>
                    </div>
                    <button className="nav-link" onClick={handleLogout}
                        style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none', marginTop: 8 }}>
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">{children}</main>

            {/* Profile Modal */}
            {showProfileModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '400px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        {/* Header */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.05))',
                            padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border-color)' 
                        }}>
                            <div style={{ 
                                width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.8rem', fontWeight: 700, color: 'white', marginBottom: '16px',
                                boxShadow: '0 8px 16px rgba(6, 182, 212, 0.3)'
                            }}>
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>{user.name}</h2>
                            <p style={{ margin: '4px 0 0', color: '#06b6d4', fontWeight: 600, fontSize: '0.9rem' }}>
                                {user.maintenanceDept ? user.maintenanceDept.replace(/_/g, ' ') : 'Maintenance Staff'}
                            </p>
                        </div>
                        
                        {/* Body Details */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                    <Mail size={18} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.email}</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                    <Hash size={18} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff / Employee ID</div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>{user.staffCode || 'Pending Assignment'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                    <BookOpen size={18} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialization Areas</div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        {user.specialization && user.specialization.length > 0 ? (
                                            user.specialization.map(spec => (
                                                <span key={spec} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                                    {spec.replace(/_/g, ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>General</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
