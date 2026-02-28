import { useState, useEffect } from 'react';
import { therapiesAPI } from '../api';
import { DoshaBar, Loader } from '../components/UI';
import toast from 'react-hot-toast';

export default function DoshaCheckPage() {
    const [symptoms, setSymptoms] = useState([]);
    const [available, setAvailable] = useState([]);
    const [selected, setSelected] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSymptoms, setLoadingSymptoms] = useState(true);

    useEffect(() => {
        therapiesAPI.getSymptoms().then(res => {
            setAvailable(res.data.symptoms || []);
            setLoadingSymptoms(false);
        }).catch(() => setLoadingSymptoms(false));
    }, []);

    const toggle = (s) => {
        setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const analyze = async () => {
        if (selected.length < 2) {
            toast.error('Select at least 2 symptoms');
            return;
        }
        setLoading(true);
        try {
            const res = await therapiesAPI.analyzeDosha({ symptoms: selected });
            setResult(res.data);
            toast.success('Analysis complete!');
        } catch (err) {
            toast.error('Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const formatSymptom = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (loadingSymptoms) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">🧘 AI Dosha Self-Check</h1>
                <p className="page-description">Select your symptoms and our AI engine will analyze your Dosha constitution</p>
            </div>

            <div className="card mb-6">
                <div className="card-title mb-4">Select Your Symptoms</div>
                <div className="chip-group">
                    {available.map(s => (
                        <button key={s} className={`chip ${selected.includes(s) ? 'selected' : ''}`} onClick={() => toggle(s)}>
                            {formatSymptom(s)}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex gap-4 items-center">
                    <button className="btn btn-primary btn-lg" onClick={analyze} disabled={loading || selected.length < 2}>
                        {loading ? 'Analyzing...' : `Analyze Dosha (${selected.length} symptoms)`}
                    </button>
                    {selected.length > 0 && (
                        <button className="btn btn-ghost" onClick={() => { setSelected([]); setResult(null); }}>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {result && !result.error && (
                <div className="slide-up">
                    <div className="card-grid card-grid-2 mb-6">
                        <div className="card">
                            <div className="card-title mb-4">Dosha Analysis Result</div>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{ fontSize: 48, fontWeight: 800, color: result.dominant_dosha === 'Vata' ? 'var(--vata)' : result.dominant_dosha === 'Pitta' ? 'var(--pitta)' : 'var(--kapha)' }}>
                                    {result.dominant_dosha}
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                    Dominant Dosha • {result.confidence}% confidence
                                </div>
                            </div>
                            <DoshaBar
                                vata={result.scores.vata}
                                pitta={result.scores.pitta}
                                kapha={result.scores.kapha}
                            />
                            <div className="mt-4" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                Matched {result.matched_symptoms} of {result.total_symptoms} symptoms
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-title mb-4">🌿 Recommended Therapies</div>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {result.recommended_therapies.map((t, i) => (
                                    <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                                        ✅ {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="card-grid card-grid-2">
                        <div className="card">
                            <div className="card-title mb-4">💊 Suggested Medicines</div>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {result.recommended_medicines.map((m, i) => (
                                    <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                                        💊 {m}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card">
                            <div className="card-title mb-4">🥗 Diet Recommendations</div>
                            <div className="mb-4">
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--secondary)', marginBottom: 8 }}>✅ Foods to Favor</div>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {result.suggested_diet?.favor?.map((d, i) => (
                                        <li key={i} style={{ padding: '4px 0', fontSize: 14 }}>• {d}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>❌ Foods to Avoid</div>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {result.suggested_diet?.avoid?.map((d, i) => (
                                        <li key={i} style={{ padding: '4px 0', fontSize: 14 }}>• {d}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
