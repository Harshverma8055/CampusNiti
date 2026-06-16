'use client';

import { getPriorityColor, getStatusColor, getCategoryIcon, STATUS_LABELS, PRIORITY_LABELS, ZONE_LABELS } from '@/lib/complaints';
import type { ComplaintListItem } from '@/lib/complaints';
import { ThumbsUp, MessageCircle, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface Props {
    complaint: ComplaintListItem;
    onVote?: (id: string) => void;
    onClick?: (id: string) => void;
    showVote?: boolean;
}

function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
}

export default function ComplaintCard({ complaint, onVote, onClick, showVote = true }: Props) {
    const priorityColor = getPriorityColor(complaint.priority);
    const statusColor   = getStatusColor(complaint.status);
    const icon          = getCategoryIcon(complaint.category);

    return (
        <div
            onClick={() => onClick?.(complaint.id)}
            style={{
                background:    'var(--bg-secondary)',
                border:        complaint.is_emergency
                    ? '2px solid #dc2626'
                    : `1px solid ${priorityColor}40`,
                borderRadius:  'var(--radius-lg)',
                overflow:      'hidden',
                cursor:        onClick ? 'pointer' : 'default',
                transition:    'transform 0.2s, box-shadow 0.2s',
                boxShadow:     complaint.is_emergency
                    ? '0 0 20px rgba(220,38,38,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => {
                if (onClick) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                }
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = complaint.is_emergency
                    ? '0 0 20px rgba(220,38,38,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.15)';
            }}
        >
            {/* Emergency Banner */}
            {complaint.is_emergency && (
                <div style={{ background: '#dc2626', color: 'white', padding: '6px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> EMERGENCY ISSUE — IMMEDIATE ATTENTION REQUIRED
                </div>
            )}

            {/* Thumbnail */}
            {(complaint.thumbnail || complaint.after_thumbnail) && (
                <div style={{ height: 160, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                    {complaint.thumbnail && (
                        <div style={{ flex: 1, position: 'relative', borderRight: complaint.after_thumbnail ? '2px solid white' : 'none' }}>
                            <img
                                src={complaint.thumbnail}
                                alt={complaint.title}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {complaint.after_thumbnail && (
                                <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>BEFORE</span>
                            )}
                        </div>
                    )}
                    {complaint.after_thumbnail && (
                        <div style={{ flex: 1, position: 'relative' }}>
                            <img
                                src={complaint.after_thumbnail}
                                alt="Resolved"
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <span style={{ position: 'absolute', bottom: 8, right: 8, background: '#22c55e', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>AFTER</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: '16px 20px' }}>
                {/* Top Row: Category icon + Priority + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            color: priorityColor, letterSpacing: 1,
                        }}>
                            {PRIORITY_LABELS[complaint.priority]}
                        </span>
                        {complaint.sla_breached && (
                            <span style={{
                                background: '#dc2626', color: 'white',
                                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                                borderRadius: 4,
                            }}>SLA BREACHED</span>
                        )}
                    </div>
                    <span style={{
                        background: `${statusColor}20`, color: statusColor,
                        border: `1px solid ${statusColor}50`,
                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                        {STATUS_LABELS[complaint.status]}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {complaint.title}
                </h3>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                    <MapPin size={13} />
                    <span>{ZONE_LABELS[complaint.zone]}{complaint.building ? ` · ${complaint.building}` : ''}</span>
                </div>

                {/* Bottom Row: votes, comments, time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {showVote && (
                            <button
                                onClick={e => { e.stopPropagation(); onVote?.(complaint.id); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: complaint.has_voted ? '#6366f120' : 'transparent',
                                    border: complaint.has_voted ? '1px solid #6366f1' : '1px solid var(--border-color)',
                                    color: complaint.has_voted ? '#6366f1' : 'var(--text-muted)',
                                    borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                }}
                            >
                                <ThumbsUp size={14} fill={complaint.has_voted ? '#6366f1' : 'none'} />
                                {complaint.upvote_count}
                            </button>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 13 }}>
                            <MessageCircle size={14} /> {complaint.comment_count}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
                        <Clock size={12} />
                        {complaint.reporter && !complaint.is_anonymous
                            ? `${complaint.reporter.name}${complaint.reporter.rollNumber ? ` (${complaint.reporter.rollNumber})` : ''} · `
                            : complaint.is_anonymous ? 'Anonymous · ' : ''}
                        {timeAgo(complaint.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
}
