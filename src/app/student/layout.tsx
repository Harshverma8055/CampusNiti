'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, History, UserCircle, LogOut, Menu, X, Users, Vote, Bell, Wrench, Info } from 'lucide-react';
import PremiumBackground from '../components/PremiumBackground';
import NotificationBell from '../components/NotificationBell';

// Register Service Worker + Subscribe to Push Notifications
async function registerPush() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
        };

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
        });
    } catch (err) {
        console.warn('Push registration failed:', err);
    }
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string;
    rollNumber?: string;
    department?: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingPollCount, setPendingPollCount] = useState(0);
    const [pollBannerDismissed, setPollBannerDismissed] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    // Register push notifications (non-blocking)
                    registerPush();
                    // Check for pending polls — show badge/banner instead of forcing redirect
                    fetch('/api/polls?status=ACTIVE')
                        .then(r => r.json())
                        .then(pollsData => {
                            if (pollsData.polls) {
                                const unvoted = pollsData.polls.filter(
                                    (p: { myVoteOptionId: string | null }) => !p.myVoteOptionId
                                );
                                setPendingPollCount(unvoted.length);
                            }
                        })
                        .catch(() => { /* non-critical */ });
                } else {
                    router.push('/login');
                }
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const navItems = [
        { href: '/student/dashboard',  label: 'Dashboard',         icon: LayoutDashboard, badge: 0 },
        { href: '/student/history',    label: 'Rating History',    icon: History,         badge: 0 },
        { href: '/student/complaints', label: 'Campus Issues',     icon: Wrench,          badge: 0 },
        { href: '/student/faculty',    label: 'Faculty Directory', icon: Users,           badge: 0 },
        { href: '/student/polls',      label: 'Voting',            icon: Vote,            badge: pendingPollCount },
        { href: '/student/directory',  label: 'Student Directory', icon: Users,           badge: 0 },
        { href: '/student/profile',    label: 'My Profile',        icon: UserCircle,      badge: 0 },
        { href: '/about',              label: 'About Project',     icon: Info,            badge: 0 },
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

            <aside className={`sidebar student-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
                        <Shield size={18} color="white" />
                    </div>
                    <div>
                        <h2>CampusNiti</h2>
                        <span>Student Panel</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${
                                pathname === item.href || pathname.startsWith(item.href + '/')
                                    ? 'student-active'
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
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="user-details">
                            <div className="name">{user.name}</div>
                            <div className="role">{user.rollNumber}</div>
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
                <div className="main-content-header">
                    <div />
                    <NotificationBell />
                </div>

                {/* Pending polls banner — non-blocking, dismissible */}
                {pendingPollCount > 0 && !pollBannerDismissed && pathname !== '/student/polls' && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <Bell size={16} color="#6366f1" />
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>
                            <strong style={{ color: '#6366f1' }}>
                                {pendingPollCount} active poll{pendingPollCount > 1 ? 's' : ''}
                            </strong>{' '}
                            awaiting your vote.
                        </span>
                        <Link
                            href="/student/polls"
                            style={{
                                fontSize: 13, fontWeight: 700, color: '#6366f1', textDecoration: 'none',
                                padding: '4px 12px', border: '1px solid #6366f1', borderRadius: 20,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Vote Now
                        </Link>
                        <button
                            onClick={() => setPollBannerDismissed(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
