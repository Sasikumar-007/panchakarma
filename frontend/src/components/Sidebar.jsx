import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiCalendar, FiFileText, FiDollarSign, FiUsers,
    FiActivity, FiSettings, FiLogOut, FiHeart, FiClipboard, FiBarChart2
} from 'react-icons/fi';

const NAV_CONFIG = {
    patient: [
        { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
        { to: '/appointments', icon: FiCalendar, label: 'Appointments' },
        { to: '/dosha-check', icon: FiActivity, label: 'AI Dosha Check' },
        { to: '/prescriptions', icon: FiFileText, label: 'Prescriptions' },
        { to: '/billing', icon: FiDollarSign, label: 'Bills & Payments' },
    ],
    doctor: [
        { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
        { to: '/appointments', icon: FiCalendar, label: 'Appointments' },
        { to: '/dosha-analysis', icon: FiActivity, label: 'Dosha Analysis' },
        { to: '/prescriptions', icon: FiFileText, label: 'Prescriptions' },
        { to: '/billing', icon: FiDollarSign, label: 'Billing' },
    ],
    therapist: [
        { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
        { to: '/therapies', icon: FiHeart, label: 'My Therapies' },
    ],
    admin: [
        { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
        { to: '/manage-users', icon: FiUsers, label: 'Manage Users' },
        { to: '/appointments', icon: FiCalendar, label: 'Appointments' },
        { to: '/analytics', icon: FiBarChart2, label: 'Analytics' },
        { to: '/billing', icon: FiDollarSign, label: 'Revenue' },
    ],
};

export default function Sidebar() {
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    const role = profile?.role || 'patient';
    const links = NAV_CONFIG[role] || NAV_CONFIG.patient;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = (profile?.full_name || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">🏥</div>
                <div>
                    <div className="sidebar-title">Panchakarma</div>
                    <div className="sidebar-subtitle">Patient Management</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Menu</div>
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div>
                        <div className="sidebar-user-name">{profile?.full_name || 'User'}</div>
                        <div className="sidebar-user-role" style={{ textTransform: 'none', marginBottom: '2px' }}>{profile?.email}</div>
                        <div className="sidebar-user-role">{role}</div>
                    </div>
                </div>
                <button className="sidebar-link" onClick={handleLogout}>
                    <FiLogOut />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
