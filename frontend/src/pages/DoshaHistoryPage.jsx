import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader, EmptyState, DoshaBar } from '../components/UI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoshaHistoryPage() {
    const { profile } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Will be wired up to an API endpoint later
        setLoading(false);
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Dosha History</h1>
                <p className="page-description">Track AI-assessed Dosha progress over time</p>
            </div>

            {history.length > 0 ? (
                <>
                    <div className="card mb-6">
                        <div className="card-title mb-4">Trend Over Time</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={history.map(h => ({ date: h.date, vata: h.scores?.vata, pitta: h.scores?.pitta, kapha: h.scores?.kapha }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="vata" stroke="var(--vata)" strokeWidth={3} />
                                <Line type="monotone" dataKey="pitta" stroke="var(--pitta)" strokeWidth={3} />
                                <Line type="monotone" dataKey="kapha" stroke="var(--kapha)" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card-grid card-grid-2">
                        {history.map((record, i) => (
                            <div className="card" key={i}>
                                <div className="card-header">
                                    <div className="card-title">{record.date}</div>
                                    <span className={`badge badge-${record.dominant_dosha.toLowerCase()}`}>{record.dominant_dosha}</span>
                                </div>
                                <DoshaBar vata={record.scores?.vata || 0} pitta={record.scores?.pitta || 0} kapha={record.scores?.kapha || 0} />
                                <div style={{ fontSize: 13, marginTop: 'var(--sp-4)', color: 'var(--text-secondary)' }}>
                                    <strong>Recommendation: </strong> {record.recommended_therapy?.join(', ') || 'None'}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="card">
                    <EmptyState icon="🧠" title="No Dosha history" text="Once a doctor runs an AI Dosha analysis, it will be saved here." />
                </div>
            )}
        </div>
    );
}
