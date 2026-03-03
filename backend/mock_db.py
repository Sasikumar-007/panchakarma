import json
import os
import uuid
from datetime import datetime

MOCK_FILE = os.path.join(os.path.dirname(__file__), "mock_data.json")

def _init_db():
    if not os.path.exists(MOCK_FILE):
        with open(MOCK_FILE, 'w') as f:
            json.dump({
                "users": [
                    {"id": "doc1", "full_name": "Dr. Smith", "email": "smith@example.com", "role": "doctor", "created_at": "2026-03-01T00:00:00Z"},
                    {"id": "ther1", "full_name": "Anna Therapist", "email": "anna@example.com", "role": "therapist", "created_at": "2026-03-01T00:00:00Z"},
                    {"id": "pat1", "full_name": "John Doe", "email": "john@example.com", "role": "patient", "created_at": "2026-03-01T00:00:00Z"},
                    {"id": "doc2", "full_name": "Dr. Strange", "email": "strange@example.com", "role": "doctor", "created_at": "2026-03-01T00:00:00Z"},
                ],
                "appointments": [],
                "therapies": [],
                "prescriptions": [],
                "billing": []
            }, f)

def get_mock_users(role=None):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    users = data.get("users", [])
    if role:
        users = [u for u in users if u["role"] == role]
    return users

def add_mock_user(email, full_name, role):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    
    new_user = {
        "id": f"mock-{role}-{str(uuid.uuid4())[:8]}",
        "email": email,
        "full_name": full_name,
        "role": role,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    data["users"].insert(0, new_user)
    
    with open(MOCK_FILE, 'w') as f:
        json.dump(data, f)
        
    return new_user

def update_mock_user(user_id, updates):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    
    for u in data["users"]:
        if u["id"] == user_id:
            for k, v in updates.items():
                u[k] = v
            break

    with open(MOCK_FILE, 'w') as f:
        json.dump(data, f)

def delete_mock_user(user_id):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    
    data["users"] = [u for u in data["users"] if u["id"] != user_id]

    with open(MOCK_FILE, 'w') as f:
        json.dump(data, f)

def get_mock_appointments():
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    return data.get("appointments", [])

def add_mock_appointment(appt):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    
    new_appt = appt.copy()
    if "id" not in new_appt:
        new_appt["id"] = f"mock-appt-{str(uuid.uuid4())[:8]}"
        
    if "appointments" not in data:
        data["appointments"] = []
    data["appointments"].insert(0, new_appt)
    
    with open(MOCK_FILE, 'w') as f:
        json.dump(data, f)
        
    return new_appt

def update_mock_appointment(appt_id, updates):
    _init_db()
    with open(MOCK_FILE, 'r') as f:
        data = json.load(f)
    
    if "appointments" not in data:
        data["appointments"] = []
        
    updated = {}
    for a in data["appointments"]:
        if a["id"] == appt_id:
            for k, v in updates.items():
                a[k] = v
            updated = a
            break

    with open(MOCK_FILE, 'w') as f:
        json.dump(data, f)
    return updated
