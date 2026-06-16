'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const markAllRead = async () => {
        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'RATING_CHANGE': return '📊';
            case 'ACHIEVEMENT': return '🏆';
            case 'INCIDENT': return '🔴';
            case 'STREAK': return '🔥';
            case 'ANNOUNCEMENT': return '📢';
            default: return '🔔';
        }
    };

    const timeAgo = (date: string) => {
        // eslint-disable-next-line react-hooks/purity
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <h3>Notifications</h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {unreadCount > 0 && (
                                <button className="notification-mark-read" onClick={markAllRead}>
                                    <Check size={14} /> Mark all read
                                </button>
                            )}
                            <button className="notification-close" onClick={() => setIsOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={32} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                >
                                    <div className="notification-item-icon">
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="notification-item-content">
                                        <div className="notification-item-title">{n.title}</div>
                                        <div className="notification-item-message">{n.message}</div>
                                        <div className="notification-item-time">{timeAgo(n.createdAt)}</div>
                                    </div>
                                    {!n.isRead && <div className="notification-unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
