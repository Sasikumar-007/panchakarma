import { useState, useEffect } from 'react';
import { billingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, EmptyState, Loader, Modal } from '../components/UI';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BillingPage() {
    const { profile } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await billingAPI.getAll();
            setBills(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (bill) => {
        setPaying(bill.id);
        try {
            await billingAPI.updateBill(bill.id, { payment_status: 'Paid' });
            toast.success('Bill marked as Paid successfully!');
            load();
        } catch (err) {
            toast.error('Failed to mark as paid');
        } finally {
            setPaying(null);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">💳 My Bills</h1>
                <p className="page-description">View and pay your bills</p>
            </div>

            <div className="card">
                {bills.length ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Therapy Name</th>
                                <th>Consultation Fee</th>
                                <th>Therapy Fee</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(b => (
                                <tr key={b.id}>
                                    <td>{b.therapies?.therapy_type || b.description || 'Treatment'}</td>
                                    <td>₹{Number(b.consultation_fee || 0).toLocaleString()}</td>
                                    <td>₹{Number(b.therapy_fee || 0).toLocaleString()}</td>
                                    <td style={{ fontWeight: 700 }}>₹{Number(b.total_amount || 0).toLocaleString()}</td>
                                    <td><StatusBadge status={b.status} /></td>
                                    <td>
                                        {b.status === 'pending' && profile?.role === 'patient' && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handlePay(b)}
                                                disabled={paying === b.id}
                                            >
                                                {paying === b.id ? 'Processing...' : 'Mark as Paid'}
                                            </button>
                                        )}
                                        {b.status === 'paid' && <span style={{ color: 'var(--success)', fontSize: 13 }}>✅ Paid</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState icon="💳" title="No bills" text="Your bills will appear here when a doctor generates them" />
                )}
            </div>
        </div>
    );
}
