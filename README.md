# Panchakarma Patient Management System

> 🏥 **AI-powered Ayurvedic healthcare management platform** built for Smart India Hackathon (SIH25023)

![React](https://img.shields.io/badge/React-18-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-green)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-purple)

## Features

- 🧘 **AI Dosha Analysis** — Rule-based engine mapping 38+ symptoms to Vata/Pitta/Kapha doshas
- 🩺 **Multi-role Dashboards** — Admin, Doctor, Therapist, Patient
- 💊 **Digital Prescriptions** — Auto-generated with therapy & medicine recommendations
- 💳 **Razorpay Payments** — Online bill payment with invoice tracking
- 📊 **Analytics Dashboard** — Revenue reports, appointment stats, therapy metrics
- 🔐 **Supabase Auth** — JWT-based authentication with Row-Level Security

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Recharts, React Router |
| Backend | Python Flask, REST APIs |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase JWT |
| Payments | Razorpay |

## Quick Start

### 1. Database Setup

Run `database/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard).

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env  # Edit with your keys
python app.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

Copy `.env.example` and fill in your credentials:

- `SUPABASE_URL` / `SUPABASE_KEY` — Supabase project credentials
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay test/live keys
- `JWT_SECRET` — Supabase JWT secret (Settings → API → JWT Secret)

## Project Structure

```
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── config.py           # Environment config
│   ├── routes/             # API route blueprints
│   ├── services/           # AI engine, payment, therapist
│   └── middleware/         # JWT auth middleware
├── frontend/
│   └── src/
│       ├── api/            # Axios API client
│       ├── components/     # Sidebar, UI components
│       ├── context/        # Auth context
│       ├── pages/          # All page components
│       └── lib/            # Supabase client
├── database/
│   └── schema.sql          # Supabase migration
└── README.md
```

## Deployment

- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Render](https://render.com)
- **Database** → [Supabase Cloud](https://supabase.com)

## Team

Built for **SIH25023** — Smart India Hackathon 2025
