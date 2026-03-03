import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

export default function Topbar() {
    const { profile } = useAuth();
    const location = useLocation();

    const getGreeting = () => {
        const path = location.pathname.substring(1).split('-').join(' ');
        if (!path || path === 'dashboard') return `Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}! 👋`;
        return path.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <header className="topbar glass-effect">
            <div className="topbar-title">{getGreeting()}</div>
            <div className="topbar-actions">
                <NotificationBell />
                <ThemeToggle />
                <div className="topbar-profile-shortcut" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                }}>
                    {(profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
            </div>
        </header>
    );
}
