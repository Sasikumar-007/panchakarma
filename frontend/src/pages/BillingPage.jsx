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
            const res = await billingAPI.initPayment(bill.id);
            const { order_id, amount, key_id } = res.data;

            // Load Razorpay checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: 'INR',
                name: 'Panchakarma PMS',
                description: bill.description || 'Treatment Payment',
                order_id: order_id,
                handler: async function (response) {
                    try {
                        await billingAPI.confirmPayment(bill.id, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('Payment successful!');
                        load();
                    } catch (err) {
                        toast.error('Payment confirmation failed');
                    }
                },
                prefill: {
                    email: profile?.email || '',
                    name: profile?.full_name || '',
                },
                theme: {
                    color: '#2563EB',
                },
            };

            if (window.Razorpay) {
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                toast.error('Razorpay SDK not loaded. Please refresh and try again.');
            }
        } catch (err) {
            toast.error('Failed to initiate payment');
        } finally {
            setPaying(null);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">💳 Bills & Payments</h1>
                <p className="page-description">View and pay your bills</p>
            </div>

            <div className="card">
                {bills.length ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(b => (
                                <tr key={b.id}>
                                    <td>{b.description || 'Treatment'}</td>
                                    <td style={{ fontWeight: 700 }}>₹{Number(b.amount).toLocaleString()}</td>
                                    <td><StatusBadge status={b.status} /></td>
                                    <td>{new Date(b.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {b.status === 'pending' && profile?.role === 'patient' && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handlePay(b)}
                                                disabled={paying === b.id}
                                            >
                                                {paying === b.id ? 'Processing...' : 'Pay Now'}
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
