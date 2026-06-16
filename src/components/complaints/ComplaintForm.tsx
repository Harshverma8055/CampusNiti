'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, AlertTriangle, MapPin, FileText, Eye, CheckCircle, RefreshCw } from 'lucide-react';
import { CATEGORY_LABELS, ZONE_LABELS } from '@/lib/complaints';
import type { ComplaintCategory, CampusZone, ComplaintSeverity } from '@/lib/complaints';

const STEPS = ['Category & Severity', 'Location', 'Details', 'Evidence', 'Review & Submit'];

interface FormState {
    category:     ComplaintCategory | '';
    severity:     ComplaintSeverity | '';
    zone:         CampusZone | '';
    building:     string;
    floor:        string;
    room:         string;
    title:        string;
    description:  string;
    is_anonymous: boolean;
    is_emergency: boolean;
    media_paths:  string[];
}

const INITIAL: FormState = {
    category: '', severity: '', zone: '', building: '', floor: '',
    room: '', title: '', description: '', is_anonymous: false,
    is_emergency: false, media_paths: [],
};

export default function ComplaintForm() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormState>(INITIAL);
    const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    const update = (k: keyof FormState, v: FormState[keyof FormState]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    // ── Client-side Image Compression ──
    // Converts images to WebP at 70% quality, max 1200px width.
    // Reduces a typical 5MB phone photo to ~150-300KB — saving 10-30x storage.
    async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
        // Skip compression for non-image files (videos, etc.)
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ratio = Math.min(maxWidth / img.width, 1);
                    canvas.width = Math.round(img.width * ratio);
                    canvas.height = Math.round(img.height * ratio);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve(file); return; }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) { resolve(file); return; }
                            // Create a new File from the compressed blob
                            const compressedName = file.name.replace(/\.[^.]+$/, '.webp');
                            const compressedFile = new File([blob], compressedName, {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            // Only use compressed version if it's actually smaller
                            resolve(compressedFile.size < file.size ? compressedFile : file);
                        },
                        'image/webp',
                        quality
                    );
                } catch { resolve(file); }
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = URL.createObjectURL(file);
        });
    }

    // Upload a file to storage via API
    async function uploadFile(file: File): Promise<string | null> {
        // Compress the image before uploading
        const optimizedFile = await compressImage(file);

        const fd = new FormData();
        fd.append('file', optimizedFile);
        fd.append('bucket', 'complaint-before');
        const res = await fetch('/api/complaints/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        // Return the signed URL if available, otherwise the storage path
        return data.signedUrl || data.storagePath;
    }

    async function handleFiles(files: FileList | null) {
        if (!files) return;
        const arr = Array.from(files).slice(0, 5 - uploadingFiles.length);
        if (!arr.length) return;

        setUploading(true);
        setError('');
        const newPreviews = arr.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...newPreviews]);
        setUploadingFiles(prev => [...prev, ...arr]);

        const paths: string[] = [];
        for (const file of arr) {
            try {
                const path = await uploadFile(file);
                if (path) paths.push(path);
            } catch (err: unknown) {
                setError((err as Error).message || 'Failed to upload one or more photos.');
            }
        }
        update('media_paths', [...form.media_paths, ...paths]);
        setUploading(false);
    }

    function removeFile(idx: number) {
        setPreviews(prev => prev.filter((_, i) => i !== idx));
        setUploadingFiles(prev => prev.filter((_, i) => i !== idx));
        update('media_paths', form.media_paths.filter((_, i) => i !== idx));
    }

    async function handleSubmit(attempt = 0) {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/complaints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    building:    form.building || undefined,
                    floor:       form.floor || undefined,
                    room:        form.room || undefined,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Handle rate limit specifically
                if (res.status === 429) {
                    setError(data.error ?? 'Daily complaint limit reached. Try again tomorrow.');
                } else if (res.status === 400 && data.details) {
                    const fieldErrors = Object.values(data.details.fieldErrors || {}).flat();
                    setError(fieldErrors.join(', ') || data.error || 'Validation failed.');
                } else {
                    setError(data.error ?? 'Submission failed. Please try again.');
                }
                setSubmitting(false);
                return;
            }

            // Success — navigate to detail page with success flag
            router.push(`/student/complaints/${data.complaintId}?submitted=1`);
        } catch {
            if (attempt < 2) {
                // Auto-retry up to 2 times on network error
                setRetryCount(attempt + 1);
                setTimeout(() => handleSubmit(attempt + 1), 2000);
            } else {
                setError('Network error. Please check your connection and try again.');
                setSubmitting(false);
                setRetryCount(0);
            }
        }
    }

    const canNext = [
        form.category && form.severity,
        form.zone,
        form.title.length >= 10 && form.description.length >= 20,
        true, // media optional
        true,
    ][step];

    const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' as const };
    const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' as const };
    const selectStyle = { ...inputStyle, cursor: 'pointer' };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
                {STEPS.map((s, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: i < step ? '#22c55e' : i === step ? '#6366f1' : 'var(--bg-glass)',
                            border: i === step ? '2px solid #6366f1' : '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: i <= step ? 'white' : 'var(--text-muted)',
                            fontSize: 13, fontWeight: 700, transition: 'all 0.3s',
                        }}>
                            {i < step ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        <span style={{ fontSize: 10, color: i === step ? '#6366f1' : 'var(--text-muted)', textAlign: 'center', fontWeight: i === step ? 700 : 400, display: step === i ? 'block' : 'none' }}>
                            {s}
                        </span>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: 28 }}>
                {/* ── STEP 0: Category & Severity ── */}
                {step === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20 }}>Category & Urgency</h2>

                        {/* Emergency Toggle */}
                        <div
                            onClick={() => update('is_emergency', !form.is_emergency)}
                            style={{
                                padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                border: form.is_emergency ? '2px solid #dc2626' : '1px solid var(--border-color)',
                                background: form.is_emergency ? 'rgba(220,38,38,0.08)' : 'var(--bg-glass)',
                                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                            }}
                        >
                            <AlertTriangle size={20} color={form.is_emergency ? '#dc2626' : 'var(--text-muted)'} />
                            <div>
                                <div style={{ fontWeight: 700, color: form.is_emergency ? '#dc2626' : 'var(--text-primary)' }}>
                                    🚨 Mark as EMERGENCY
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Safety hazard / immediate risk to life or property
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Issue Category *</label>
                            <select
                                style={selectStyle}
                                value={form.category}
                                onChange={e => update('category', e.target.value as ComplaintCategory)}
                            >
                                <option value="">-- Select Category --</option>
                                {(Object.entries(CATEGORY_LABELS) as [ComplaintCategory, string][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Severity Level *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                                {(['LOW','MODERATE','HIGH','CRITICAL'] as ComplaintSeverity[]).map(s => {
                                    const colors: Record<string, string> = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
                                    const descs: Record<string, string> = { LOW: 'Minor inconvenience', MODERATE: 'Affects daily use', HIGH: 'Major disruption', CRITICAL: 'Dangerous condition' };
                                    return (
                                        <div
                                            key={s}
                                            onClick={() => update('severity', s)}
                                            style={{
                                                padding: '12px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                border: form.severity === s ? `2px solid ${colors[s]}` : '1px solid var(--border-color)',
                                                background: form.severity === s ? `${colors[s]}15` : 'var(--bg-glass)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, color: colors[s], fontSize: 14 }}>{s}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{descs[s]}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: Location ── */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={20} /> Location Details
                        </h2>
                        <div>
                            <label style={labelStyle}>Campus Zone *</label>
                            <select style={selectStyle} value={form.zone} onChange={e => update('zone', e.target.value as CampusZone)}>
                                <option value="">-- Select Zone --</option>
                                {(Object.entries(ZONE_LABELS) as [CampusZone, string][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Building / Block</label>
                                <input style={inputStyle} placeholder="e.g. Block A" value={form.building} onChange={e => update('building', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Floor</label>
                                <input style={inputStyle} placeholder="e.g. 2nd Floor" value={form.floor} onChange={e => update('floor', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Room / Area</label>
                                <input style={inputStyle} placeholder="e.g. Room 204" value={form.room} onChange={e => update('room', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Details ── */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={20} /> Issue Details
                        </h2>
                        <div>
                            <label style={labelStyle}>Title * ({form.title.length}/200)</label>
                            <input
                                style={inputStyle} maxLength={200}
                                placeholder="Short, clear description of the problem"
                                value={form.title} onChange={e => update('title', e.target.value)}
                            />
                            {form.title.length > 5 && form.title.length < 10 && (
                                <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>⚠ Title must be at least 10 characters</p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Description * ({form.description.length}/2000)</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
                                placeholder="Describe the issue in detail: what is damaged, when you noticed it, how it affects students..."
                                value={form.description} maxLength={2000}
                                onChange={e => update('description', e.target.value)}
                            />
                        </div>
                        {/* Anonymous toggle */}
                        <div
                            onClick={() => update('is_anonymous', !form.is_anonymous)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)', background: 'var(--bg-glass)',
                            }}
                        >
                            <div style={{
                                width: 20, height: 20, borderRadius: 4, border: '2px solid #6366f1',
                                background: form.is_anonymous ? '#6366f1' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {form.is_anonymous && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Submit Anonymously</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your name won&apos;t be shown publicly</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Evidence Upload ── */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Upload size={20} /> Upload Evidence
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                            Attach photos/videos of the issue. Max 5 files. Photos are <strong style={{ color: 'var(--text-secondary)' }}>auto-compressed</strong> to save space. Optional but strongly recommended.
                        </p>

                        {/* Drop zone */}
                        <label
                            htmlFor="file-upload"
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: 12, padding: '36px 20px',
                                border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)',
                                cursor: previews.length >= 5 ? 'not-allowed' : 'pointer',
                                background: 'var(--bg-glass)', transition: 'border-color 0.2s',
                                opacity: previews.length >= 5 ? 0.5 : 1,
                            }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                        >
                            <Upload size={32} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
                                Drop files here or <strong style={{ color: '#6366f1' }}>click to browse</strong>
                                <br />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {previews.length}/5 files added
                                </span>
                            </span>
                            <input
                                id="file-upload" type="file" multiple accept="image/*,video/mp4"
                                style={{ display: 'none' }}
                                onChange={e => handleFiles(e.target.files)}
                                disabled={uploading || previews.length >= 5}
                            />
                        </label>

                        {uploading && (
                            <div style={{ color: '#6366f1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="spinner" style={{ width: 16, height: 16 }} /> Uploading files...
                            </div>
                        )}

                        {/* Previews */}
                        {previews.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                                {previews.map((src, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                                        <img src={src} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                background: 'rgba(0,0,0,0.7)', border: 'none',
                                                borderRadius: '50%', width: 22, height: 22,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <X size={12} color="white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 4: Review & Submit ── */}
                {step === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Eye size={20} /> Review Your Complaint
                        </h2>
                        {[
                            ['Category', CATEGORY_LABELS[form.category as ComplaintCategory] ?? form.category],
                            ['Severity', form.severity],
                            ['Zone', ZONE_LABELS[form.zone as CampusZone] ?? form.zone],
                            ['Location', [form.building, form.floor, form.room].filter(Boolean).join(' · ') || 'Not specified'],
                            ['Title', form.title],
                            ['Anonymous', form.is_anonymous ? 'Yes' : 'No'],
                            ['Emergency', form.is_emergency ? '🚨 YES' : 'No'],
                            ['Evidence files', `${previews.length} file(s) attached`],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ minWidth: 130, fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: 8, padding: 14, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong>Description:</strong><br />{form.description}
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 14, color: '#ef4444', fontSize: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <AlertTriangle size={16} />
                                    <strong>Submission Error</strong>
                                </div>
                                {error}
                                {retryCount > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                                        Retrying automatically... ({retryCount}/2)
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
                    {step > 0 ? (
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setStep(s => s - 1)}
                            disabled={submitting}
                            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            ← Back
                        </button>
                    ) : <div />}

                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => canNext && setStep(s => s + 1)}
                            disabled={!canNext}
                            style={{ opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleSubmit(0)}
                            disabled={submitting || uploading}
                            style={{
                                background: form.is_emergency ? '#dc2626' : undefined,
                                minWidth: 180,
                                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    {retryCount > 0 ? `Retrying (${retryCount}/2)...` : 'Submitting...'}
                                </>
                            ) : form.is_emergency ? (
                                '🚨 Submit Emergency'
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    Submit Complaint
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
