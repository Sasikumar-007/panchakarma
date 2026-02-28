-- =============================================
-- Panchakarma Patient Management System
-- Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'therapist', 'patient')),
    phone TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PATIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT DEFAULT '' CHECK (gender IN ('', 'male', 'female', 'other')),
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    medical_history TEXT DEFAULT '',
    blood_group TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- THERAPISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialization TEXT DEFAULT 'General',
    availability BOOLEAN DEFAULT TRUE,
    experience_years INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOSHA RESULTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS dosha_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    symptoms JSONB DEFAULT '[]',
    vata_score NUMERIC DEFAULT 0,
    pitta_score NUMERIC DEFAULT 0,
    kapha_score NUMERIC DEFAULT 0,
    dominant_dosha TEXT DEFAULT '',
    confidence NUMERIC DEFAULT 0,
    recommended_therapy JSONB DEFAULT '[]',
    medicines JSONB DEFAULT '[]',
    diet JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- THERAPIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS therapies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id),
    therapy_type TEXT NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    progress_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRESCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis TEXT DEFAULT '',
    medicines JSONB DEFAULT '[]',
    instructions TEXT DEFAULT '',
    dosha_result_id UUID REFERENCES dosha_results(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BILLING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT DEFAULT 'Panchakarma Treatment',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID REFERENCES billing(id) ON DELETE CASCADE,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosha_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapies ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "users_select" ON users FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY "users_all" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Patients: own data + doctors/admins
CREATE POLICY "patients_select" ON patients FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor'))
);

-- Appointments: own + assigned doctor + admin
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Therapies: assigned therapist + patient + doctor + admin
CREATE POLICY "therapies_select" ON therapies FOR SELECT USING (
    EXISTS (SELECT 1 FROM therapists t WHERE t.id = therapist_id AND t.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor'))
);

-- Prescriptions: patient + doctor + admin
CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Billing: patient + admin
CREATE POLICY "billing_select" ON billing FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'doctor'))
);

-- Service role bypass (for backend)
CREATE POLICY "service_role_bypass_users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_patients" ON patients FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_therapists" ON therapists FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_appointments" ON appointments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_dosha" ON dosha_results FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_therapies" ON therapies FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_prescriptions" ON prescriptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_billing" ON billing FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_payments" ON payments FOR ALL TO service_role USING (true);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_therapies_therapist ON therapies(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapies_patient ON therapies(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
