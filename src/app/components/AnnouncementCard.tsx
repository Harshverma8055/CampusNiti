'use client';

import { Pin, AlertTriangle, Calendar, BookOpen, Megaphone, Users } from 'lucide-react';

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

interface AnnouncementCardProps {
    announcements: Announcement[];
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    ACADEMIC: { icon: <BookOpen size={14} />, color: 'var(--accent-sky)', bg: 'rgba(14, 165, 233, 0.12)' },
    EVENTS: { icon: <Calendar size={14} />, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.12)' },
    DISCIPLINE: { icon: <AlertTriangle size={14} />, color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.12)' },
    GENERAL: { icon: <Megaphone size={14} />, color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.12)' },
};

export default function AnnouncementCard({ announcements }: AnnouncementCardProps) {
    if (announcements.length === 0) return null;

    const timeAgo = (date: string) => {
        // eslint-disable-next-line react-hooks/purity
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="announcements-section">
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2><Megaphone size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Announcements</h2>
            </div>
            <div className="announcements-list">
                {announcements.slice(0, 5).map(a => {
                    const catConfig = categoryConfig[a.category] || categoryConfig.GENERAL;
                    return (
                        <div
                            key={a.id}
                            className={`announcement-item ${a.isUrgent ? 'urgent' : ''} ${a.isPinned ? 'pinned' : ''}`}
                        >
                            <div className="announcement-item-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {a.isPinned && (
                                        <span className="announcement-pin">
                                            <Pin size={12} />
                                        </span>
                                    )}
                                    <span className="announcement-category" style={{ background: catConfig.bg, color: catConfig.color }}>
                                        {catConfig.icon} {a.category}
                                    </span>
                                    {a.isUrgent && (
                                        <span className="announcement-urgent-badge">
                                            <AlertTriangle size={12} /> URGENT
                                        </span>
                                    )}
                                </div>
                                <span className="announcement-time">{timeAgo(a.createdAt)}</span>
                            </div>
                            <h4 className="announcement-title">{a.title}</h4>
                            <p className="announcement-content">{a.content}</p>
                            <div className="announcement-footer">
                                <Users size={12} />
                                <span>{a.author.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
