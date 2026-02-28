import { useState, useEffect } from 'react';
import { therapiesAPI, prescriptionsAPI, billingAPI, appointmentsAPI } from '../api';
import { DoshaBar, Loader, Modal } from '../components/UI';
import toast from 'react-hot-toast';

export default function DoshaAnalysisPage() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [symptoms, setSymptoms] = useState([]);
    const [available, setAvailable] = useState([]);
    const [selected, setSelected] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [showPrescription, setShowPrescription] = useState(false);
    const [rxForm, setRxForm] = useState({ medicines: '', instructions: '', diagnosis: '' });
    const [billForm, setBillForm] = useState({ amount: '', description: 'Panchakarma Treatment' });
    const [therapistSuggestion, setTherapistSuggestion] = useState(null);

    useEffect(() => {
        Promise.all([
            appointmentsAPI.getAll(),
            therapiesAPI.getSymptoms(),
        ]).then(([appts, syms]) => {
            setAppointments(appts.data.filter(a => a.status === 'scheduled'));
            setAvailable(syms.data.symptoms || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const toggle = (s) => setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    const fmt = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const analyze = async () => {
        if (!selectedAppt || selected.length < 2) {
            toast.error('Select an appointment and at least 2 symptoms');
            return;
        }
        setAnalyzing(true);
        try {
            const res = await therapiesAPI.analyzeDosha({
                symptoms: selected,
                patient_id: selectedAppt.patient_id,
                save: true,
            });
            setResult(res.data);

            // Auto-suggest therapist
            if (res.data.recommended_therapies?.length) {
                const suggestion = await therapiesAPI.suggestTherapist({
                    therapy_type: res.data.recommended_therapies[0],
                });
                setTherapistSuggestion(suggestion.data);
            }
            toast.success('Dosha analysis complete!');
        } catch (err) {
            toast.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const generatePrescription = async () => {
        try {
            await prescriptionsAPI.create({
                appointment_id: selectedAppt.id,
                patient_id: selectedAppt.patient_id,
                diagnosis: rxForm.diagnosis || `${result.dominant_dosha} Dosha imbalance`,
                medicines: rxForm.medicines.split(',').map(m => m.trim()).filter(Boolean),
                instructions: rxForm.instructions,
            });
            toast.success('Prescription generated!');
            setShowPrescription(false);
        } catch (err) {
            toast.error('Failed to generate prescription');
        }
    };

    const generateBill = async () => {
        if (!billForm.amount) { toast.error('Enter amount'); return; }
        try {
            await billingAPI.create({
                patient_id: selectedAppt.patient_id,
                appointment_id: selectedAppt.id,
                amount: parseFloat(billForm.amount),
                description: billForm.description,
            });
            toast.success('Bill generated!');
            setBillForm({ amount: '', description: 'Panchakarma Treatment' });
        } catch (err) {
            toast.error('Failed to generate bill');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">🩺 Dosha Analysis Console</h1>
                <p className="page-description">Enter symptoms, run AI analysis, prescribe treatment, and generate bills</p>
            </div>

            {/* Step 1: Select Appointment */}
            <div className="card mb-6">
                <div className="card-title mb-4">Step 1: Select Appointment</div>
                <select
                    className="form-input"
                    value={selectedAppt?.id || ''}
                    onChange={e => setSelectedAppt(appointments.find(a => a.id === e.target.value))}
                >
                    <option value="">Choose a scheduled appointment</option>
                    {appointments.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.patients?.users?.full_name || 'Patient'} — {a.date} {a.time_slot}
                        </option>
                    ))}
                </select>
            </div>

            {/* Step 2: Select Symptoms */}
            {selectedAppt && (
                <div className="card mb-6 slide-up">
                    <div className="card-title mb-4">Step 2: Enter Symptoms</div>
                    <div className="chip-group">
                        {available.map(s => (
                            <button key={s} className={`chip ${selected.includes(s) ? 'selected' : ''}`} onClick={() => toggle(s)}>
                                {fmt(s)}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6">
                        <button className="btn btn-primary btn-lg" onClick={analyze} disabled={analyzing || selected.length < 2}>
                            {analyzing ? 'Analyzing...' : `Run AI Dosha Analysis (${selected.length} symptoms)`}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {result && !result.error && (
                <div className="slide-up">
                    <div className="card-grid card-grid-2 mb-6">
                        <div className="card">
                            <div className="card-title mb-4">Analysis Result</div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{
                                    fontSize: 42, fontWeight: 800,
                                    color: result.dominant_dosha === 'Vata' ? 'var(--vata)' : result.dominant_dosha === 'Pitta' ? 'var(--pitta)' : 'var(--kapha)'
                                }}>
                                    {result.dominant_dosha}
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{result.confidence}% confidence</div>
                            </div>
                            <DoshaBar vata={result.scores.vata} pitta={result.scores.pitta} kapha={result.scores.kapha} />
                        </div>

                        <div className="card">
                            <div className="card-title mb-4">Recommended Therapies</div>
                            {result.recommended_therapies.map((t, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                                    ✅ {t}
                                </div>
                            ))}
                            {therapistSuggestion?.recommended && (
                                <div className="mt-4" style={{ padding: 12, background: 'var(--secondary-50)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--secondary)' }}>
                                        🧘 Suggested Therapist: {therapistSuggestion.recommended.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Specialization: {therapistSuggestion.recommended.specialization}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Actions */}
                    <div className="card-grid card-grid-2">
                        <div className="card">
                            <div className="card-title mb-4">📝 Generate Prescription</div>
                            <div className="form-group">
                                <label className="form-label">Diagnosis</label>
                                <input className="form-input" value={rxForm.diagnosis} onChange={e => setRxForm(f => ({ ...f, diagnosis: e.target.value }))}
                                    placeholder={`${result.dominant_dosha} Dosha imbalance`} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Medicines (comma-separated)</label>
                                <input className="form-input" value={rxForm.medicines} onChange={e => setRxForm(f => ({ ...f, medicines: e.target.value }))}
                                    placeholder={result.recommended_medicines.join(', ')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instructions</label>
                                <textarea className="form-input" value={rxForm.instructions} onChange={e => setRxForm(f => ({ ...f, instructions: e.target.value }))}
                                    placeholder="Dosage and care instructions" rows={3} />
                            </div>
                            <button className="btn btn-primary" onClick={generatePrescription}>Generate Prescription</button>
                        </div>

                        <div className="card">
                            <div className="card-title mb-4">💳 Generate Bill</div>
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input className="form-input" type="number" value={billForm.amount} onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="e.g. 5000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={billForm.description} onChange={e => setBillForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <button className="btn btn-secondary" onClick={generateBill}>Generate Bill</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
