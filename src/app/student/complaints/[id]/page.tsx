'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import {
    getPriorityColor, getStatusColor, getCategoryIcon,
    STATUS_LABELS, PRIORITY_LABELS, ZONE_LABELS,
} from '@/lib/complaints';
import { MapPin, AlertTriangle, ArrowLeft, CheckCircle, ThumbsUp, Bell, BellOff, MessageSquare } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export default function StudentComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const justSubmitted = searchParams.get('submitted') === '1';

    const [data, setData] = useState<AnyRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successVisible, setSuccessVisible] = useState(justSubmitted);
    const [voting, setVoting] = useState(false);
    const [following, setFollowing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [commentError, setCommentError] = useState('');

    useEffect(() => {
        fetch(`/api/complaints/${id}`)
            .then(res => {
                if (!res.ok) throw new Error(res.status === 404 ? 'Complaint not found' : 'Failed to load complaint');
                return res.json();
            })
            .then(d => {
                if (d.error) throw new Error(d.error);
                setData(d.complaint);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    // Auto-dismiss success banner after 5s
    useEffect(() => {
        if (successVisible) {
            const t = setTimeout(() => setSuccessVisible(false), 6000);
            return () => clearTimeout(t);
        }
    }, [successVisible]);

    async function handleVote() {
        if (!data || voting) return;
        setVoting(true);
        try {
            const res = await fetch(`/api/complaints/${id}/vote`, { method: 'POST' });
            const d = await res.json();
            if (res.ok) {
                setData((prev: AnyRecord) => ({
                    ...prev,
                    has_voted: d.voted,
                    upvote_count: d.upvote_count,
                }));
            }
        } finally {
            setVoting(false);
        }
    }

    async function handleFollow() {
        if (!data || following) return;
        setFollowing(true);
        try {
            const method = data.is_followed ? 'DELETE' : 'POST';
            const res = await fetch(`/api/complaints/${id}/follow`, { method });
            if (res.ok) {
                setData((prev: AnyRecord) => ({ ...prev, is_followed: !prev.is_followed }));
            }
        } finally {
            setFollowing(false);
        }
    }

    async function postComment() {
        if (!commentText.trim() || postingComment) return;
        setPostingComment(true);
        setCommentError('');
        try {
            const res = await fetch(`/api/complaints/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText.trim() }),
            });
            const d = await res.json();
            if (!res.ok) {
                setCommentError(d.error || 'Failed to post comment.');
            } else {
                setCommentText('');
                // Re-fetch to get updated comments
                const refreshed = await fetch(`/api/complaints/${id}`).then(r => r.json());
                if (refreshed.complaint) setData(refreshed.complaint);
            }
        } finally {
            setPostingComment(false);
        }
    }

    if (loading) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading complaint details...</p>
        </div>
    );

    if (error || !data) return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Complaint Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                {error || 'This complaint does not exist or you do not have access to it.'}
            </p>
            <button onClick={() => router.push('/student/complaints')} className="btn btn-primary">
                ← Back to Complaints
            </button>
        </div>
    );

    const pColor = getPriorityColor(data.priority);
    const sColor = getStatusColor(data.status);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Back button */}
            <button onClick={() => router.back()} className="btn" style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <ArrowLeft size={16} /> Back
            </button>

            {/* ✅ Success Banner */}
            {successVisible && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))',
                    border: '1px solid rgba(34,197,94,0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                }}>
                    <CheckCircle size={24} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16, marginBottom: 4 }}>
                            🎉 Complaint Submitted Successfully!
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            Your complaint has been received and is pending admin review. You&apos;ll receive a notification when it&apos;s approved and assigned.
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 20, color: '#16a34a' }}>
                                📋 Status: Pending Review
                            </span>
                            <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 20, color: '#16a34a' }}>
                                🔔 Notifications enabled
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setSuccessVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>✕</button>
                </div>
            )}

            {/* Main complaint card */}
            <div className="card" style={{ padding: 24 }}>
                {data.is_emergency && (
                    <div style={{ background: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <AlertTriangle size={16} /> EMERGENCY ISSUE — Immediate Attention Required
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{getCategoryIcon(data.category)}</span>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 8px', fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.3 }}>{data.title}</h1>
                        {data.reporter && (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                Reported by {data.reporter.rollNumber || data.reporter.name || 'Student'}
                            </span>
                        )}
                        {data.is_anonymous && (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reported anonymously</span>
                        )}
                    </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ color: pColor, background: `${pColor}20`, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {PRIORITY_LABELS[data.priority as keyof typeof PRIORITY_LABELS] || data.priority}
                    </span>
                    <span style={{ color: sColor, background: `${sColor}20`, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {STATUS_LABELS[data.status as keyof typeof STATUS_LABELS] || data.status}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                        <MapPin size={13} /> {ZONE_LABELS[data.zone as keyof typeof ZONE_LABELS] || data.zone}
                        {data.building ? ` · ${data.building}` : ''}
                        {data.floor ? ` · ${data.floor}` : ''}
                        {data.room ? ` (${data.room})` : ''}
                    </span>
                </div>

                {/* Description */}
                <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {data.description}
                </div>

                {/* Evidence & Resolution Media */}
                {data.complaint_media && data.complaint_media.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
                        {data.complaint_media.some((m: AnyRecord) => m.is_before) && (
                            <div>
                                <h3 style={{ marginTop: 0, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>📎 Problem Evidence (Before)</h3>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {(data.complaint_media as AnyRecord[]).filter(m => m.is_before).map((media: AnyRecord) => (
                                        media.media_type === 'IMAGE' ? (
                                            <a key={media.id} href={media.public_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={media.public_url}
                                                    alt="Evidence"
                                                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                                />
                                            </a>
                                        ) : (
                                            <a key={media.id} href={media.public_url} target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 32 }}>
                                                🎬
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                        {data.complaint_media.some((m: AnyRecord) => m.is_after) && (
                            <div>
                                <h3 style={{ marginTop: 0, fontSize: 15, color: '#22c55e', marginBottom: 12 }}>✅ Resolution Proof (After)</h3>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {(data.complaint_media as AnyRecord[]).filter(m => m.is_after).map((media: AnyRecord) => (
                                        <a key={media.id} href={media.public_url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={media.public_url}
                                                alt="Resolution Proof"
                                                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #22c55e', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }}
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleVote}
                        disabled={voting}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: data.has_voted ? '#6366f120' : 'var(--bg-glass)',
                            border: data.has_voted ? '1px solid #6366f1' : '1px solid var(--border-color)',
                            borderRadius: 20, cursor: voting ? 'not-allowed' : 'pointer',
                            color: data.has_voted ? '#6366f1' : 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        }}
                    >
                        <ThumbsUp size={14} />
                        {data.has_voted ? 'Upvoted' : 'Upvote'} ({data.upvote_count ?? 0})
                    </button>
                    <button
                        onClick={handleFollow}
                        disabled={following}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: data.is_followed ? '#f59e0b20' : 'var(--bg-glass)',
                            border: data.is_followed ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                            borderRadius: 20, cursor: following ? 'not-allowed' : 'pointer',
                            color: data.is_followed ? '#f59e0b' : 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        }}
                    >
                        {data.is_followed ? <BellOff size={14} /> : <Bell size={14} />}
                        {data.is_followed ? 'Unfollow' : 'Follow Updates'}
                    </button>
                </div>
            </div>

            {/* Timeline */}
            {data.complaint_updates && data.complaint_updates.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: 'var(--text-primary)' }}>📋 Status Timeline</h2>
                    <ComplaintTimeline
                        updates={data.complaint_updates}
                        currentStatus={data.status}
                        createdAt={data.created_at}
                    />
                </div>
            )}

            {/* Comments section */}
            {data.complaint_comments && (
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare size={18} /> Discussion ({data.complaint_comments.filter((c: AnyRecord) => !c.is_deleted).length})
                    </h2>

                    {data.complaint_comments.filter((c: AnyRecord) => !c.is_deleted).map((comment: AnyRecord) => (
                        <div key={comment.id} style={{
                            padding: '12px 16px', marginBottom: 10,
                            background: comment.is_official ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            border: comment.is_official ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-color)',
                        }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: comment.is_official ? '#6366f1' : 'var(--text-primary)' }}>
                                    {comment.is_official ? '🏛️ Official' : ''} {comment.author?.name || 'User'}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {new Date(comment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{comment.content}</p>
                        </div>
                    ))}

                    {/* Add comment */}
                    <div style={{ marginTop: 16 }}>
                        <textarea
                            style={{
                                width: '100%', padding: '10px 14px', background: 'var(--bg-glass)',
                                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)', fontSize: 14, minHeight: 90, resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                            placeholder="Add a comment or update..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            maxLength={1000}
                        />
                        {commentError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{commentError}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{commentText.length}/1000</span>
                            <button
                                onClick={postComment}
                                disabled={!commentText.trim() || postingComment}
                                className="btn btn-primary"
                                style={{ opacity: (!commentText.trim() || postingComment) ? 0.5 : 1 }}
                            >
                                {postingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
