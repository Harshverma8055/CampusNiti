'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Lock, ArrowRight, Shield } from 'lucide-react';
import PremiumBackground from '../components/PremiumBackground';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
            } else {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
                        <Shield size={32} color="#10b981" />
                    </div>
                </div>
                <h2 style={{ color: 'white', marginBottom: '12px' }}>Password Reset Successful!</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Your password has been updated securely. Redirecting you to the login page...
                </p>
            </div>
        );
    }

    return (
        <div className="login-card">
            <div className="login-logo">
                <div className="logo-icon">
                    <KeyRound size={28} color="white" />
                </div>
                <h1>Create New Password</h1>
            </div>

            <div style={{
                width: '60%', height: 1, margin: '0 auto 28px',
                background: 'linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)',
                opacity: 0.4,
            }} />

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>New Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: 40 }}
                            placeholder="Enter new password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={!token}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: 40 }}
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={!token}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !token}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '24px' }}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                            Updating...
                        </>
                    ) : (
                        <>
                            Reset Password
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="login-container">
            <PremiumBackground />
            <Suspense fallback={<div className="login-card"><p style={{ color: 'white', textAlign: 'center' }}>Loading...</p></div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
