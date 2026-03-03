import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState({ id: 'mock-id', email: 'user@example.com' });
    const [profile, setProfile] = useState({ full_name: 'Mock User', role: 'patient' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedRole = localStorage.getItem('mock_role');
        const storedEmail = localStorage.getItem('mock_email');
        if (storedRole) {
            setProfile({ full_name: `${storedRole.charAt(0).toUpperCase() + storedRole.slice(1)} User`, role: storedRole });
            setUser({ id: 'mock-id', email: storedEmail || 'user@example.com' });
        }
        localStorage.setItem('access_token', 'mock-token');
    }, []);

    const fetchProfile = async (token) => {
        return { data: profile };
    };

    const login = async (email, password, role = 'patient') => {
        localStorage.setItem('access_token', 'mock-token');
        localStorage.setItem('mock_role', role);
        localStorage.setItem('mock_email', email);

        setUser({ id: 'mock-id', email: email });
        setProfile({ full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`, role: role });
        return { session: { access_token: 'mock-token' }, user: { id: 'mock-id', email: email } };
    };

    const register = async (formData) => {
        // Mock register
        return await login(formData.email, formData.password);
    };

    const logout = async () => {
        localStorage.removeItem('access_token');
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, register, logout, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
