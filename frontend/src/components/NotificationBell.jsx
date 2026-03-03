import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { notificationsAPI } from '../api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await notificationsAPI.getAll();
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Polling every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await notificationsAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read");
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: 'var(--radius-full)',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: 'var(--shadow)',
                    position: 'relative'
                }}
            >
                <FiBell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        border: '2px solid var(--surface)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                        Notifications
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} style={{
                                padding: 'var(--sp-4)',
                                borderBottom: '1px solid var(--border-light)',
                                background: n.is_read ? 'transparent' : 'var(--primary-50)',
                                cursor: 'pointer'
                            }} onClick={() => !n.is_read && markAsRead(n.id)}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    {new Date(n.created_at).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: n.is_read ? 400 : 500 }}>
                                    {n.message}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
