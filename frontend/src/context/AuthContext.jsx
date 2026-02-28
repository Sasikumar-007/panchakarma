import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                localStorage.setItem('access_token', session.access_token);
                setUser(session.user);
                fetchProfile(session.access_token);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                localStorage.setItem('access_token', session.access_token);
                setUser(session.user);
                fetchProfile(session.access_token);
            } else {
                localStorage.removeItem('access_token');
                setUser(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (token) => {
        try {
            if (token) localStorage.setItem('access_token', token);
            const res = await authAPI.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('access_token', data.session.access_token);
        setUser(data.user);
        await fetchProfile(data.session.access_token);
        return data;
    };

    const register = async (formData) => {
        // Register via backend to create user + patient records
        const res = await authAPI.register(formData);
        // Then sign in
        await login(formData.email, formData.password);
        return res.data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
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
