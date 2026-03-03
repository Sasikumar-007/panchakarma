import { useState, useEffect } from 'react';
import { logsAPI } from '../api';
import { Loader, EmptyState } from '../components/UI';

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        logsAPI.getAll().then(res => {
            setLogs(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Activity Logs</h1>
                <p className="page-description">System-wide audit trail for administrative tracking</p>
            </div>

            <div className="card">
                {logs.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Action Type</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.users?.full_name || 'System User'}</td>
                                    <td>
                                        <span className={`badge ${log.role === 'admin' ? 'badge-purple' : log.role === 'doctor' ? 'badge-blue' : 'badge-green'}`}>
                                            {log.role}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{log.action_type.replace(/_/g, ' ').toUpperCase()}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{log.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState icon="🛡️" title="No logs found" text="Activity logs will populate as the system is used." />
                )}
            </div>
        </div>
    );
}
