'use client';

import { getStatusColor, STATUS_LABELS } from '@/lib/complaints';
import type { ComplaintUpdate, ComplaintStatus } from '@/lib/complaints';
import { CheckCircle, Clock, XCircle, Wrench, UserCheck, Eye, Archive } from 'lucide-react';

const STATUS_ICONS: Record<ComplaintStatus, React.ReactNode> = {
    PENDING_REVIEW: <Clock size={16} />,
    APPROVED:       <Eye size={16} />,
    ASSIGNED:       <UserCheck size={16} />,
    IN_PROGRESS:    <Wrench size={16} />,
    RESOLVED:       <CheckCircle size={16} />,
    REJECTED:       <XCircle size={16} />,
    ARCHIVED:       <Archive size={16} />,
};

interface Props {
    updates:       ComplaintUpdate[];
    currentStatus: ComplaintStatus;
    createdAt:     string;
}

function fmtDate(d: string) {
    return new Date(d).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function ComplaintTimeline({ updates, currentStatus, createdAt }: Props) {
    const items = [
        {
            id: 'created',
            label: 'Complaint Submitted',
            note: 'Issue submitted by student. Awaiting admin review.',
            created_at: createdAt,
            new_status: null as ComplaintStatus | null,
            old_status: null as ComplaintStatus | null,
            isSystem: true,
            media_urls: [] as string[],
            posted_by: { name: 'System', role: 'SYSTEM' },
        },
        ...updates.map(u => ({ ...u, isSystem: false })),
    ];

    return (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
            {/* Vertical line */}
            <div style={{
                position: 'absolute', left: 12, top: 24, bottom: 0,
                width: 2, background: 'var(--border-color)',
            }} />

            {items.map((item, idx) => {
                const status = item.new_status ?? (idx === 0 ? 'PENDING_REVIEW' : currentStatus) as ComplaintStatus;
                const color  = getStatusColor(status as ComplaintStatus);
                const isLast = idx === items.length - 1;

                return (
                    <div key={item.id} style={{ display: 'flex', gap: 0, marginBottom: isLast ? 0 : 28, position: 'relative' }}>
                        {/* Dot */}
                        <div style={{
                            position: 'absolute', left: -28,
                            width: 28, height: 28, borderRadius: '50%',
                            background: isLast ? color : `${color}30`,
                            border: `2px solid ${color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isLast ? 'white' : color,
                            zIndex: 1,
                        }}>
                            {STATUS_ICONS[status as ComplaintStatus]}
                        </div>

                        {/* Content */}
                        <div style={{
                            background:   'var(--bg-glass)',
                            border:       `1px solid ${isLast ? color : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding:      '14px 18px',
                            width:        '100%',
                            marginLeft:   8,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {item.new_status && (
                                        <span style={{
                                            background: `${color}20`, color, border: `1px solid ${color}50`,
                                            borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                                        }}>
                                            {STATUS_LABELS[status as ComplaintStatus]}
                                        </span>
                                    )}
                                    {item.posted_by && (
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {item.posted_by.name}
                                            {!item.isSystem && (
                                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                                                    {' '}· {item.posted_by.role}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(item.created_at ?? createdAt)}</span>
                            </div>

                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {item.note}
                            </p>

                            {/* After-repair media */}
                            {item.media_urls && item.media_urls.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                    {item.media_urls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={url} alt={`Update photo ${i + 1}`}
                                                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }}
                                                loading="lazy"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
