import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, therapiesAPI, billingAPI, adminAPI } from '../api';
import { StatCard, StatusBadge, EmptyState, Loader } from '../components/UI';
import { FiCalendar, FiUsers, FiDollarSign, FiActivity, FiHeart } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DOSHA_COLORS = ['#8B5CF6', '#EF4444', '#06B6D4'];

export default function Dashboard() {
    const { profile } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [profile]);

    const loadDashboard = async () => {
        try {
            const role = profile?.role;
            if (role === 'admin') {
                const [dashboard, analytics, revenue] = await Promise.all([
                    adminAPI.getDashboard(),
                    adminAPI.getAnalytics(),
                    billingAPI.getRevenue(),
                ]);
                setData({ dashboard: dashboard.data, analytics: analytics.data, revenue: revenue.data });
            } else if (role === 'doctor') {
                const [appts, therapies] = await Promise.all([
                    appointmentsAPI.getAll(),
                    therapiesAPI.getAll(),
                ]);
                setData({ appointments: appts.data, therapies: therapies.data });
            } else if (role === 'therapist') {
                const therapies = await therapiesAPI.getAll();
                setData({ therapies: therapies.data });
            } else {
                const [appts, bills] = await Promise.all([
                    appointmentsAPI.getAll(),
                    billingAPI.getAll(),
                ]);
                setData({ appointments: appts.data, bills: bills.data });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    const role = profile?.role || 'patient';

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Welcome, {profile?.full_name || 'User'} 👋</h1>
                <p className="page-description">
                    {role === 'admin' && 'System overview and analytics'}
                    {role === 'doctor' && "Today's appointments and patient care"}
                    {role === 'therapist' && 'Your assigned therapies'}
                    {role === 'patient' && 'Your health dashboard'}
                </p>
            </div>

            {/* Admin Dashboard */}
            {role === 'admin' && data?.analytics && (
                <>
                    <div className="card-grid card-grid-4 mb-6">
                        <StatCard icon={<FiUsers />} label="Total Users" value={data.dashboard?.total_users || 0} color="purple" />
                        <StatCard icon={<FiUsers />} label="Doctors" value={data.dashboard?.doctors || 0} color="blue" />
                        <StatCard icon={<FiHeart />} label="Therapists" value={data.dashboard?.therapists || 0} color="green" />
                        <StatCard icon={<FiUsers />} label="Patients" value={data.dashboard?.patients || 0} color="yellow" />
                    </div>
                    <div className="card-grid card-grid-2">
                        <div className="card">
                            <div className="card-title mb-4">Appointments Overview</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={[
                                    { name: 'Scheduled', count: data.analytics.appointments?.scheduled || 0 },
                                    { name: 'Completed', count: data.analytics.appointments?.completed || 0 },
                                    { name: 'Active Therapies', count: data.analytics.active_therapies || 0 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card">
                            <div className="card-title mb-4">Revenue Summary</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Collected', value: data.revenue?.total_revenue || 0 },
                                            { name: 'Pending', value: data.revenue?.pending_amount || 0 },
                                        ]}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                                    >
                                        <Cell fill="#16A34A" />
                                        <Cell fill="#F59E0B" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-between mt-4" style={{ padding: '0 20px' }}>
                                <span className="badge badge-green">Collected: ₹{(data.revenue?.total_revenue || 0).toLocaleString()}</span>
                                <span className="badge badge-yellow">Pending: ₹{(data.revenue?.pending_amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Doctor Dashboard */}
            {role === 'doctor' && (
                <>
                    <div className="card-grid card-grid-3 mb-6">
                        <StatCard icon={<FiCalendar />} label="Total Appointments" value={data?.appointments?.length || 0} color="blue" />
                        <StatCard icon={<FiActivity />} label="Pending" value={data?.appointments?.filter(a => a.status === 'scheduled').length || 0} color="yellow" />
                        <StatCard icon={<FiHeart />} label="Active Therapies" value={data?.therapies?.filter(t => t.status === 'in_progress').length || 0} color="green" />
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Recent Appointments</div>
                        </div>
                        {data?.appointments?.length ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.appointments.slice(0, 8).map(a => (
                                        <tr key={a.id}>
                                            <td>{a.patients?.users?.full_name || '—'}</td>
                                            <td>{a.date}</td>
                                            <td>{a.time_slot}</td>
                                            <td><StatusBadge status={a.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <EmptyState icon="📅" title="No appointments yet" text="Appointments will appear here" />}
                    </div>
                </>
            )}

            {/* Therapist Dashboard */}
            {role === 'therapist' && (
                <>
                    <div className="card-grid card-grid-3 mb-6">
                        <StatCard icon={<FiHeart />} label="Total Therapies" value={data?.therapies?.length || 0} color="purple" />
                        <StatCard icon={<FiActivity />} label="In Progress" value={data?.therapies?.filter(t => t.status === 'in_progress').length || 0} color="yellow" />
                        <StatCard icon={<FiCalendar />} label="Completed" value={data?.therapies?.filter(t => t.status === 'completed').length || 0} color="green" />
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Assigned Therapies</div>
                        </div>
                        {data?.therapies?.length ? (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Patient</th><th>Therapy</th><th>Status</th><th>Started</th></tr>
                                </thead>
                                <tbody>
                                    {data.therapies.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.patients?.users?.full_name || '—'}</td>
                                            <td>{t.therapy_type}</td>
                                            <td><StatusBadge status={t.status} /></td>
                                            <td>{t.start_date || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <EmptyState icon="🧘" title="No therapies assigned" text="Your assigned therapies will appear here" />}
                    </div>
                </>
            )}

            {/* Patient Dashboard */}
            {role === 'patient' && (
                <>
                    <div className="card-grid card-grid-3 mb-6">
                        <StatCard icon={<FiCalendar />} label="Appointments" value={data?.appointments?.length || 0} color="blue" />
                        <StatCard icon={<FiActivity />} label="Upcoming" value={data?.appointments?.filter(a => a.status === 'scheduled').length || 0} color="green" />
                        <StatCard icon={<FiDollarSign />} label="Pending Bills" value={data?.bills?.filter(b => b.status === 'pending').length || 0} color="yellow" />
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">My Appointments</div>
                        </div>
                        {data?.appointments?.length ? (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {data.appointments.slice(0, 5).map(a => (
                                        <tr key={a.id}>
                                            <td>{a.doctor?.full_name || '—'}</td>
                                            <td>{a.date}</td>
                                            <td>{a.time_slot}</td>
                                            <td><StatusBadge status={a.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <EmptyState icon="📅" title="No appointments" text="Book your first appointment to get started" />}
                    </div>
                </>
            )}
        </div>
    );
}
