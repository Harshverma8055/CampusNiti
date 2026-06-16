'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, Users, GraduationCap, AlertTriangle, Megaphone, BarChart3, KeyRound, ClipboardList, LogOut, Menu, X, Scale, Wrench, Building2, QrCode, Info } from 'lucide-react';
import PremiumBackground from '../components/PremiumBackground';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [actionRequiredCount, setActionRequiredCount] = useState(0);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.role === 'ADMIN') {
                    setUser(data.user);
                    // Fetch complaints that need admin action (PENDING_REVIEW or RESOLVED)
                    fetch('/api/complaints?status=PENDING_REVIEW,RESOLVED')
                        .then(r => r.json())
                        .then(resData => {
                            if (resData.complaints) {
                                setActionRequiredCount(resData.complaints.length);
                            }
                        })
                        .catch(() => {});
                }
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const navItems = [
        { href: '/admin/dashboard',      label: 'Dashboard',       icon: LayoutDashboard, badge: 0 },
        { href: '/admin/students',       label: 'Students',        icon: GraduationCap,   badge: 0 },
        { href: '/admin/faculty',        label: 'Faculty',         icon: Users,           badge: 0 },
        { href: '/admin/incidents',      label: 'Incidents',       icon: AlertTriangle,   badge: 0 },
        { href: '/admin/complaints',     label: 'Campus Issues',   icon: Wrench,          badge: actionRequiredCount },
        { href: '/admin/departments',    label: 'Departments',     icon: Building2,       badge: 0 },
        { href: '/admin/deduction-table',label: 'Deduction Table', icon: Scale,           badge: 0 },
        { href: '/admin/announcements',  label: 'Announcements',   icon: Megaphone,       badge: 0 },
        { href: '/admin/qr-tags',        label: 'QR Tags',         icon: QrCode,          badge: 0 },
        { href: '/admin/analytics',      label: 'Analytics',       icon: BarChart3,       badge: 0 },

        { href: '/admin/audit-log',      label: 'Audit Log',       icon: ClipboardList,   badge: 0 },
        { href: '/about',                label: 'About Project',   icon: Info,            badge: 0 },
    ];

    if (!user) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <PremiumBackground />
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <Shield size={18} color="white" />
                    </div>
                    <div>
                        <h2>CampusNiti</h2>
                        <span style={{ color: '#f59e0b' }}>Admin Panel</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${
                                pathname === item.href || pathname.startsWith(item.href + '/')
                                    ? 'active admin-active'
                                    : ''
                            }`}
                            onClick={() => setSidebarOpen(false)}
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}
                        >
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
                    <div className="user-info">
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            GA
                        </div>
                        <div className="user-details">
                            <div className="name">{user.name}</div>
                            <div className="role" style={{ color: '#f59e0b' }}>Administrator</div>
                        </div>
                    </div>
                    <button
                        className="nav-link"
                        onClick={handleLogout}
                        style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none', marginTop: 8 }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
