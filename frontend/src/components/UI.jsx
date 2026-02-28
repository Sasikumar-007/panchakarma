export function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const map = {
        scheduled: 'badge-blue',
        in_progress: 'badge-yellow',
        completed: 'badge-green',
        cancelled: 'badge-red',
        assigned: 'badge-purple',
        pending: 'badge-yellow',
        paid: 'badge-green',
        refunded: 'badge-gray',
    };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>;
}

export function EmptyState({ icon = '📋', title, text, action }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <div className="empty-state-title">{title}</div>
            <div className="empty-state-text">{text}</div>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function StatCard({ icon, label, value, color = 'blue' }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

export function Loader() {
    return (
        <div className="loading-page">
            <div className="spinner"></div>
            <div className="loading-text">Loading...</div>
        </div>
    );
}

export function DoshaBar({ vata = 0, pitta = 0, kapha = 0 }) {
    return (
        <div>
            <div className="dosha-bar">
                <div className="dosha-bar-vata" style={{ width: `${vata}%` }}></div>
                <div className="dosha-bar-pitta" style={{ width: `${pitta}%` }}></div>
                <div className="dosha-bar-kapha" style={{ width: `${kapha}%` }}></div>
            </div>
            <div className="dosha-legend">
                <div className="dosha-legend-item">
                    <div className="dosha-dot" style={{ background: 'var(--vata)' }}></div>
                    Vata {vata}%
                </div>
                <div className="dosha-legend-item">
                    <div className="dosha-dot" style={{ background: 'var(--pitta)' }}></div>
                    Pitta {pitta}%
                </div>
                <div className="dosha-legend-item">
                    <div className="dosha-dot" style={{ background: 'var(--kapha)' }}></div>
                    Kapha {kapha}%
                </div>
            </div>
        </div>
    );
}
