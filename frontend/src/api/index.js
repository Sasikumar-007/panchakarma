import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// Appointments
export const appointmentsAPI = {
    getAll: () => api.get('/appointments'),
    getOne: (id) => api.get(`/appointments/${id}`),
    create: (data) => api.post('/appointments', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    cancel: (id) => api.delete(`/appointments/${id}`),
    getDoctors: () => api.get('/appointments/doctors'),
};

// Therapies & Dosha
export const therapiesAPI = {
    getAll: () => api.get('/therapies'),
    create: (data) => api.post('/therapies', data),
    update: (id, data) => api.put(`/therapies/${id}`, data),
    complete: (id, data) => api.post(`/therapies/${id}/complete`, data),
    analyzeDosha: (data) => api.post('/therapies/dosha/analyze', data),
    getSymptoms: () => api.get('/therapies/dosha/symptoms'),
    suggestTherapist: (data) => api.post('/therapies/suggest-therapist', data),
};

// Prescriptions
export const prescriptionsAPI = {
    getAll: () => api.get('/prescriptions'),
    getOne: (id) => api.get(`/prescriptions/${id}`),
    create: (data) => api.post('/prescriptions', data),
};

// Billing
export const billingAPI = {
    getAll: () => api.get('/billing'),
    create: (data) => api.post('/billing', data),
    initPayment: (id) => api.post(`/billing/${id}/pay`),
    confirmPayment: (id, data) => api.post(`/billing/${id}/confirm`, data),
    getRevenue: () => api.get('/billing/revenue'),
};

// Admin
export const adminAPI = {
    getUsers: (role) => api.get('/admin/users', { params: { role } }),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getAnalytics: () => api.get('/admin/analytics'),
    addTherapist: (data) => api.post('/admin/therapists', data),
};

export default api;
