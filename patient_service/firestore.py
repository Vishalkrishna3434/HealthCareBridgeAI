import uuid
from datetime import datetime

# Mock database for MVP
_MOCK_DB = {}

def add_medication(user_id: str, data: dict) -> dict:
    med_id = str(uuid.uuid4())
    data["id"] = med_id
    data["created_at"] = datetime.now().isoformat()
    
    if user_id not in _MOCK_DB:
        _MOCK_DB[user_id] = {"medications": [], "adherence": []}
    
    _MOCK_DB[user_id]["medications"].append(data)
    return data

def get_medications(user_id: str) -> list:
    return _MOCK_DB.get(user_id, {}).get("medications", [])

def log_adherence(user_id: str, data: dict) -> str:
    log_id = str(uuid.uuid4())
    data["id"] = log_id
    
    if user_id not in _MOCK_DB:
        _MOCK_DB[user_id] = {"medications": [], "adherence": []}
        
    _MOCK_DB[user_id]["adherence"].append(data)
    return log_id
