import { useState, useEffect } from 'react';
import { therapiesAPI } from '../api';
import { StatusBadge, EmptyState, Loader, Modal } from '../components/UI';
import toast from 'react-hot-toast';

export default function TherapiesPage() {
    const [therapies, setTherapies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await therapiesAPI.getAll();
            setTherapies(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateProgress = async () => {
        if (!selected) return;
        try {
            await therapiesAPI.update(selected.id, {
                status: 'in_progress',
                progress_notes: notes,
            });
            toast.success('Progress updated');
            setSelected(null);
            setNotes('');
            load();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const markComplete = async (id) => {
        try {
            await therapiesAPI.complete(id, { final_notes: 'Therapy completed successfully' });
            toast.success('Therapy marked as completed');
            load();
        } catch (err) {
            toast.error('Failed to complete therapy');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">🧘 Therapies</h1>
                <p className="page-description">Manage assigned therapy sessions</p>
            </div>

            <div className="card">
                {therapies.length ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Therapy Type</th>
                                <th>Status</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {therapies.map(t => (
                                <tr key={t.id}>
                                    <td>{t.patients?.users?.full_name || '—'}</td>
                                    <td>{t.therapy_type}</td>
                                    <td><StatusBadge status={t.status} /></td>
                                    <td>{t.start_date || '—'}</td>
                                    <td>{t.end_date || '—'}</td>
                                    <td className="flex gap-2">
                                        {t.status !== 'completed' && (
                                            <>
                                                <button className="btn btn-sm btn-outline" onClick={() => { setSelected(t); setNotes(t.progress_notes || ''); }}>
                                                    Update
                                                </button>
                                                <button className="btn btn-sm btn-secondary" onClick={() => markComplete(t.id)}>
                                                    Complete
                                                </button>
                                            </>
                                        )}
                                        {t.status === 'completed' && <span style={{ color: 'var(--success)', fontSize: 13 }}>✅ Done</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState icon="🧘" title="No therapies" text="Assigned therapies will appear here" />
                )}
            </div>

            <Modal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={`Update: ${selected?.therapy_type || ''}`}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={updateProgress}>Save Progress</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Progress Notes</label>
                    <textarea
                        className="form-input"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Describe therapy progress, patient response, observations..."
                    />
                </div>
            </Modal>
        </div>
    );
}
