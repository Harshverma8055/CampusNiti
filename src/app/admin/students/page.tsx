'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Search, Edit3, Trash2, KeyRound, X, RefreshCw } from 'lucide-react';

const departments = [
    'Computer Science and Engineering', 'Data Science and Engineering', 'Information Technology',
    'Mathematics and Computing', 'Electronics and Communication Engineering', 'Electrical Engineering',
    'Instrumentation and Control Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Biotechnology', 'Textile Technology', 'Industrial and Production Engineering',
];

interface Student {
    id: string; userId: string; name: string; email: string;
    rollNumber: string; department: string; year: number; rating: number; createdAt: string;
}

export default function AdminStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', rollNumber: '', department: '', year: 1 });
    const [createError, setCreateError] = useState('');

    // Edit modal
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', rollNumber: '', department: '', year: 1 });
    const [editing, setEditing] = useState(false);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Password reset
    const [resetStudent, setResetStudent] = useState<Student | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    const [actionMsg, setActionMsg] = useState('');

    const fetchStudents = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterDept) params.set('department', filterDept);
        if (filterYear) params.set('year', filterYear);

        const res = await fetch(`/api/admin/students?${params.toString()}`);
        const data = await res.json();
        if (data.students) setStudents(data.students);
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchStudents(); }, [filterDept, filterYear]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchStudents(); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');

        const res = await fetch('/api/admin/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createForm),
        });
        const data = await res.json();

        if (!res.ok) {
            setCreateError(data.error || 'Failed to create student');
            setCreating(false);
            return;
        }

        setShowCreate(false);
        setCreateForm({ name: '', email: '', password: '', rollNumber: '', department: '', year: 1 });
        setCreating(false);
        setActionMsg('Student created successfully!');
        setTimeout(() => setActionMsg(''), 3000);
        fetchStudents();
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStudent) return;
        setEditing(true);

        await fetch(`/api/admin/students/${editStudent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });

        setEditStudent(null);
        setEditing(false);
        setActionMsg('Student updated successfully!');
        setTimeout(() => setActionMsg(''), 3000);
        fetchStudents();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);

        await fetch(`/api/admin/students/${deleteId}`, { method: 'DELETE' });

        setDeleteId(null);
        setDeleting(false);
        setActionMsg('Student deleted successfully!');
        setTimeout(() => setActionMsg(''), 3000);
        fetchStudents();
    };

    const handlePasswordReset = async () => {
        if (!resetStudent || !newPassword) return;
        setResetting(true);

        await fetch('/api/admin/password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: resetStudent.userId, newPassword }),
        });

        setResetStudent(null);
        setNewPassword('');
        setResetting(false);
        setActionMsg('Password reset successfully!');
        setTimeout(() => setActionMsg(''), 3000);
    };

    const openEdit = (s: Student) => {
        setEditStudent(s);
        setEditForm({ name: s.name, email: s.email, rollNumber: s.rollNumber, department: s.department, year: s.year });
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><GraduationCap size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />Manage Students</h1>
                    <p>Create, edit, and manage student accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={18} /> Create Student
                </button>
            </div>

            {actionMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, animation: 'cardSlideUp 0.3s ease' }}>
                    ✓ {actionMsg}
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ flex: 2, minWidth: 200 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Name, email, or roll number..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </form>
                    <div style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Department</label>
                        <select className="form-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 0, minWidth: 100 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Year</label>
                        <select className="form-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                            <option value="">All</option>
                            <option value="1">1st</option>
                            <option value="2">2nd</option>
                            <option value="3">3rd</option>
                            <option value="4">4th</option>
                        </select>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={fetchStudents} style={{ marginBottom: 2 }}>
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="card">
                <div className="card-header">
                    <h2>Students ({students.length})</h2>
                </div>
                {loading ? (
                    <div className="loading-container" style={{ minHeight: 200 }}><div className="spinner" /></div>
                ) : students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <GraduationCap size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <h3>No students found</h3>
                        <p>Create a student to get started</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div className="data-table-wrapper"><table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Roll No.</th>
                                    <th>Department</th>
                                    <th>Year</th>
                                    <th>Rating</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.email}</td>
                                        <td><span className="badge badge-category">{s.rollNumber}</span></td>
                                        <td style={{ fontSize: 13 }}>{s.department}</td>
                                        <td style={{ textAlign: 'center' }}>{s.year}</td>
                                        <td>
                                            <span className={`badge ${s.rating >= 80 ? 'badge-positive' : s.rating >= 50 ? 'badge-amber' : 'badge-negative'}`}>
                                                {s.rating}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)} title="Edit">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-outline" onClick={() => { setResetStudent(s); setNewPassword(''); }} title="Reset Password" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)' }}>
                                                    <KeyRound size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(s.id)} title="Delete" style={{ padding: '6px 10px' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Create New Student</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {createError && <div className="error-message">{createError}</div>}
                                <div className="responsive-grid-half">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input className="form-input" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Student name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input className="form-input" type="email" required value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="student@email.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input className="form-input" type="password" required minLength={6} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 6 characters" />
                                    </div>
                                    <div className="form-group">
                                        <label>Roll Number</label>
                                        <input className="form-input" required value={createForm.rollNumber} onChange={e => setCreateForm({ ...createForm, rollNumber: e.target.value })} placeholder="e.g. 22103045" />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <select className="form-select" required value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })}>
                                            <option value="">Select</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Year</label>
                                        <select className="form-select" value={createForm.year} onChange={e => setCreateForm({ ...createForm, year: parseInt(e.target.value) })}>
                                            <option value={1}>1st Year</option>
                                            <option value={2}>2nd Year</option>
                                            <option value={3}>3rd Year</option>
                                            <option value={4}>4th Year</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editStudent && (
                <div className="modal-overlay" onClick={() => setEditStudent(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Edit Student</h3>
                            <button className="modal-close" onClick={() => setEditStudent(null)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="modal-body">
                                <div className="responsive-grid-half">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input className="form-input" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input className="form-input" type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Roll Number</label>
                                        <input className="form-input" required value={editForm.rollNumber} onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <select className="form-select" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Year</label>
                                        <select className="form-select" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: parseInt(e.target.value) })}>
                                            <option value={1}>1st Year</option>
                                            <option value={2}>2nd Year</option>
                                            <option value={3}>3rd Year</option>
                                            <option value={4}>4th Year</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setEditStudent(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={editing}>
                                    {editing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-body" style={{ textAlign: 'center', padding: 32 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                            <h3 style={{ marginBottom: 8 }}>Delete Student?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                                This will permanently delete the student account, all rating history, streaks, and achievements. This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {resetStudent && (
                <div className="modal-overlay" onClick={() => setResetStudent(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3>Reset Password</h3>
                            <button className="modal-close" onClick={() => setResetStudent(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resetting password for:</div>
                                <div style={{ fontWeight: 600, marginTop: 4 }}>{resetStudent.name}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{resetStudent.email}</div>
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input className="form-input" type="password" minLength={6} placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setResetStudent(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handlePasswordReset} disabled={resetting || newPassword.length < 6}>
                                {resetting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
