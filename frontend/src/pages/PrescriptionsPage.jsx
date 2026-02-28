import { useState, useEffect } from 'react';
import { prescriptionsAPI } from '../api';
import { EmptyState, Loader } from '../components/UI';

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        prescriptionsAPI.getAll().then(res => {
            setPrescriptions(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Prescriptions</h1>
                <p className="page-description">Your digital prescriptions</p>
            </div>

            {prescriptions.length ? (
                <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {prescriptions.map(p => (
                        <div key={p.id} className="card">
                            <div className="card-header">
                                <div>
                                    <div className="card-title">
                                        Prescription — {new Date(p.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        Dr. {p.doctor?.full_name || p.patients?.users?.full_name || '—'}
                                    </div>
                                </div>
                                <span className="badge badge-blue">Digital Rx</span>
                            </div>

                            {p.diagnosis && (
                                <div className="mb-4">
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Diagnosis</div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.diagnosis}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Medicines</div>
                                <div className="chip-group">
                                    {(p.medicines || []).map((m, i) => (
                                        <span key={i} className="badge badge-green">{typeof m === 'string' ? m : m.name}</span>
                                    ))}
                                </div>
                            </div>

                            {p.instructions && (
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Instructions</div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.instructions}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <EmptyState icon="📋" title="No prescriptions" text="Your prescriptions from doctors will appear here" />
                </div>
            )}
        </div>
    );
}
