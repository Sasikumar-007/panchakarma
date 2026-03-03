import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Modal, StatusBadge, EmptyState, Loader } from '../components/UI';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
    const { profile } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ doctor_id: '', date: '', time_slot: '', notes: '', status: 'scheduled' });

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const [appts, docs] = await Promise.all([
                appointmentsAPI.getAll(),
                appointmentsAPI.getDoctors(),
            ]);
            setAppointments(appts.data);
            setDoctors(docs.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await appointmentsAPI.update(editId, form);
                toast.success('Appointment updated!');
            } else {
                await appointmentsAPI.create(form);
                toast.success('Appointment booked!');
            }
            setShowModal(false);
            setForm({ doctor_id: '', date: '', time_slot: '', notes: '', status: 'scheduled' });
            setEditMode(false);
            setEditId(null);
            load();
        } catch (err) {
            toast.error(editMode ? 'Failed to update' : 'Failed to book appointment');
        }
    };

    const handleEditClick = (appt) => {
        setForm({
            doctor_id: appt.doctor_id || '',
            date: appt.date || '',
            time_slot: appt.time_slot || '',
            notes: appt.notes || '',
            status: appt.status || 'scheduled'
        });
        setEditId(appt.id);
        setEditMode(true);
        setShowModal(true);
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel this appointment?')) return;
        try {
            await appointmentsAPI.cancel(id);
            toast.success('Appointment cancelled');
            load();
        } catch (err) {
            toast.error('Failed to cancel');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Appointments</h1>
                    <p className="page-description">Manage your appointments</p>
                </div>
                {profile?.role === 'patient' && (
                    <button className="btn btn-primary" onClick={() => {
                        setEditMode(false);
                        setForm({ doctor_id: '', date: '', time_slot: '', notes: '', status: 'scheduled' });
                        setShowModal(true);
                    }}>
                        <FiPlus /> Book Appointment
                    </button>
                )}
            </div>

            <div className="card">
                {appointments.length ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(a => (
                                <tr key={a.id}>
                                    <td>{a.patients?.users?.full_name || '—'}</td>
                                    <td>{a.doctor?.full_name || '—'}</td>
                                    <td>{a.date}</td>
                                    <td>{a.time_slot}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td className="flex gap-2">
                                        {profile?.role === 'admin' && (
                                            <button className="btn btn-sm btn-ghost" onClick={() => handleEditClick(a)}>Edit</button>
                                        )}
                                        {a.status === 'scheduled' && (
                                            <button className="btn btn-sm btn-ghost" onClick={() => handleCancel(a.id)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState icon="📅" title="No appointments" text="Book an appointment to get started with your care." />
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editMode ? 'Edit Appointment' : 'Book Appointment'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleBook}>{editMode ? 'Save Changes' : 'Book'}</button>
                    </>
                }
            >
                <form onSubmit={handleBook}>
                    <div className="form-group">
                        <label className="form-label">Select Doctor</label>
                        <select className="form-input" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
                            <option value="">Choose a doctor</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Time Slot</label>
                        <select className="form-input" value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} required>
                            <option value="">Select time</option>
                            {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    {editMode && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe your symptoms or concerns" />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
