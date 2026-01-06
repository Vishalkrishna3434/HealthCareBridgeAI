import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI(title="HealthBridge Patient Management")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Database & Eventing ---
_MOCK_DB = {}

def add_medication(user_id: str, data: dict) -> dict:
    med_id = str(uuid.uuid4())
    data["id"] = med_id
    data["created_at"] = datetime.now().isoformat()
    if user_id not in _MOCK_DB: _MOCK_DB[user_id] = {"medications": [], "adherence": []}
    _MOCK_DB[user_id]["medications"].append(data)
    return data

def get_medications(user_id: str) -> list:
    return _MOCK_DB.get(user_id, {}).get("medications", [])

def log_adherence(user_id: str, data: dict) -> str:
    log_id = str(uuid.uuid4())
    data["id"] = log_id
    if user_id not in _MOCK_DB: _MOCK_DB[user_id] = {"medications": [], "adherence": []}
    _MOCK_DB[user_id]["adherence"].append(data)
    return log_id

def publish_adherence_event(user_id: str, event_data: dict):
    print(f"[Pub/Sub] Published adherence event: {json.dumps(event_data)}")

# --- Authentication ---
def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "): raise HTTPException(status_code=401)
    token = authorization.split("Bearer ")[1]
    if token == "valid_token": return {"uid": "user_123"}
    raise HTTPException(status_code=401, detail="Invalid token")

# --- Models ---
class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str

class AdherenceEvent(BaseModel):
    medication_id: str
    status: str
    timestamp: str

# --- Endpoints ---
@app.get("/health")
def health_check(): return {"status": "healthy", "service": "patient-service"}

@app.get("/medications", response_model=List[dict])
def list_medications(user = Depends(verify_token)):
    return get_medications(user["uid"])

@app.post("/medications")
def create_medication(med: Medication, user = Depends(verify_token)):
    return add_medication(user["uid"], med.dict())

@app.post("/adherence")
async def record_adherence(event: AdherenceEvent, background_tasks: BackgroundTasks, user = Depends(verify_token)):
    log_id = log_adherence(user["uid"], event.dict())
    background_tasks.add_task(publish_adherence_event, user["uid"], event.dict())
    return {"status": "recorded", "log_id": log_id}
