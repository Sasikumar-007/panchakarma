import os
from dotenv import load_dotenv
from supabase import create_client, Client
import razorpay

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:1234")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "dummy")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "dummy")
if not SUPABASE_URL:
    print("Warning: SUPABASE_URL is not set in environment; set it in backend/.env or system env vars")
if not SUPABASE_KEY and not SUPABASE_SERVICE_KEY:
    print("Warning: SUPABASE_KEY or SUPABASE_SERVICE_KEY not set; backend Supabase access will fail without keys")
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret")

# Razorpay
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")

# Flask
SECRET_KEY = os.getenv("SECRET_KEY", "flask-secret-key-change-in-prod")
DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"
PORT = int(os.getenv("PORT", 5000))

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_admin() -> Client:
    key = SUPABASE_SERVICE_KEY or SUPABASE_KEY
    return create_client(SUPABASE_URL, key)

def get_razorpay_client():
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
