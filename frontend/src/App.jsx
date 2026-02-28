import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { Loader } from './components/UI';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AppointmentsPage from './pages/AppointmentsPage';
import DoshaCheckPage from './pages/DoshaCheckPage';
import DoshaAnalysisPage from './pages/DoshaAnalysisPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import BillingPage from './pages/BillingPage';
import TherapiesPage from './pages/TherapiesPage';
import ManageUsersPage from './pages/ManageUsersPage';

import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <AppLayout><AppointmentsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dosha-check" element={
        <ProtectedRoute>
          <AppLayout><DoshaCheckPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dosha-analysis" element={
        <ProtectedRoute>
          <AppLayout><DoshaAnalysisPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/prescriptions" element={
        <ProtectedRoute>
          <AppLayout><PrescriptionsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute>
          <AppLayout><BillingPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/therapies" element={
        <ProtectedRoute>
          <AppLayout><TherapiesPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/manage-users" element={
        <ProtectedRoute>
          <AppLayout><ManageUsersPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#0F172A',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
