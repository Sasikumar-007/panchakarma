import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({
        full_name: '', email: '', password: '', phone: '',
        gender: '', dob: '', address: '', role: 'patient',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form);
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card slide-up" style={{ maxWidth: 520 }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">🏥</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join Panchakarma Patient Management</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" name="full_name" placeholder="Your full name" value={form.full_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" name="phone" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select className="form-input" name="gender" value={form.gender} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input className="form-input" name="dob" type="date" value={form.dob} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea className="form-input" name="address" placeholder="Your address" value={form.address} onChange={handleChange} rows={2} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
