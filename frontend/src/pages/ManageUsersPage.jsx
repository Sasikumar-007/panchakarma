import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { StatusBadge, EmptyState, Loader, Modal, StatCard } from '../components/UI';
import { FiUsers, FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ full_name: '', role: '' });

    useEffect(() => { load(); }, [roleFilter]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers(roleFilter || undefined);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (u) => {
        setEditUser(u);
        setEditForm({ full_name: u.full_name, role: u.role });
    };

    const saveEdit = async () => {
        try {
            await adminAPI.updateUser(editUser.id, editForm);
            toast.success('User updated');
            setEditUser(null);
            load();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deleted');
            load();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">👥 Manage Users</h1>
                    <p className="page-description">View and manage all system users</p>
                </div>
                <div className="flex gap-2">
                    {['', 'doctor', 'therapist', 'patient', 'admin'].map(r => (
                        <button
                            key={r}
                            className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setRoleFilter(r)}
                        >
                            {r || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                {loading ? <Loader /> : users.length ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-red' :
                                                u.role === 'doctor' ? 'badge-blue' :
                                                    u.role === 'therapist' ? 'badge-purple' : 'badge-green'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="flex gap-2">
                                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(u)}><FiEdit2 /></button>
                                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(u.id)}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState icon="👥" title="No users found" text="Users will appear here once they register" />
                )}
            </div>

            <Modal
                isOpen={!!editUser}
                onClose={() => setEditUser(null)}
                title="Edit User"
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="therapist">Therapist</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </Modal>
        </div>
    );
}
