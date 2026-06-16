'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import {
    getPriorityColor, getStatusColor, getCategoryIcon,
    STATUS_LABELS, PRIORITY_LABELS, ZONE_LABELS,
} from '@/lib/complaints';
import { MapPin, AlertTriangle, ArrowLeft, CheckCircle, MessageSquare, X } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export default function MaintenanceComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const justSubmitted = searchParams.get('submitted') === '1';

    const [data, setData] = useState<AnyRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);

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
            <button onClick={() => router.back()} className="btn btn-primary">
                ← Back
            </button>
        </div>
    );

    const pColor = getPriorityColor(data.priority);
    const sColor = getStatusColor(data.status);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Back button */}
            <button onClick={() => router.push('/maintenance/dashboard')} className="btn" style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center', background: '#ffffff', border: 'none', color: '#000000', fontWeight: 700, padding: '8px 18px', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(255,255,255,0.15)', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(255,255,255,0.25)'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(255,255,255,0.15)'; }}>
                <ArrowLeft size={16} color="#000000" /> Back to Dashboard
            </button>


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

                {/* Description & Location */}
                <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {data.description}

                    {/* Exact GPS Map */}
                    {data.gps_lat && data.gps_lng && (
                        <div style={{ marginTop: 20 }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <MapPin size={16} color="#ef4444" /> Exact Issue Location
                            </h3>
                            <iframe
                                width="100%"
                                height="250"
                                style={{ borderRadius: 8, border: '1px solid var(--border-color)' }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${data.gps_lat},${data.gps_lng}&t=&z=18&ie=UTF8&iwloc=&output=embed`}
                            />
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                                Coordinates: {data.gps_lat.toFixed(6)}, {data.gps_lng.toFixed(6)}
                            </div>
                        </div>
                    )}
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
                                            <div key={media.id} onClick={() => setSelectedMedia({ url: media.public_url, type: 'IMAGE' })}>
                                                <img
                                                    src={media.public_url}
                                                    alt="Evidence"
                                                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                                />
                                            </div>
                                        ) : (
                                            <div key={media.id} onClick={() => setSelectedMedia({ url: media.public_url, type: 'VIDEO' })}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 32, cursor: 'pointer' }}>
                                                🎬
                                            </div>
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
                                        media.media_type === 'IMAGE' ? (
                                            <div key={media.id} onClick={() => setSelectedMedia({ url: media.public_url, type: 'IMAGE' })}>
                                                <img
                                                    src={media.public_url}
                                                    alt="Resolution Proof"
                                                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #22c55e', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }}
                                                    onError={(e) => {
                                                        // Fallback if image fails to load
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Broken+Image';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div key={media.id} onClick={() => setSelectedMedia({ url: media.public_url, type: 'VIDEO' })}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '2px solid #22c55e', fontSize: 32, cursor: 'pointer' }}>
                                                🎬
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}


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

            {/* Lightbox Modal */}
            {selectedMedia && (
                <div
                    onClick={() => setSelectedMedia(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: 20, boxSizing: 'border-box',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <button
                        onClick={() => setSelectedMedia(null)}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                            borderRadius: '50%', width: 40, height: 40,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            cursor: 'pointer', zIndex: 10000
                        }}
                    >
                        <X size={24} />
                    </button>
                    {selectedMedia.type === 'IMAGE' ? (
                        <img
                            src={selectedMedia.url}
                            alt="Full Screen Media"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <video
                            src={selectedMedia.url}
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                            onClick={e => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
