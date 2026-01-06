from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import firestore
import auth
import events

app = FastAPI(title="HealthBridge Patient Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str

class AdherenceLog(BaseModel):
    medication_id: str
    status: str # "taken", "skipped"
    timestamp: str

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    user = auth.verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "patient-service"}

@app.get("/medications", response_model=List[dict])
async def list_medications(user: dict = Depends(get_current_user)):
    return firestore.get_medications(user["uid"])

@app.post("/medications")
async def add_medication(med: Medication, user: dict = Depends(get_current_user)):
    return firestore.add_medication(user["uid"], med.dict())

@app.post("/adherence")
async def log_adherence(log: AdherenceLog, user: dict = Depends(get_current_user)):
    log_data = log.dict()
    res = firestore.log_adherence(user["uid"], log_data)
    # Publish event for analytics
    events.publish_adherence_event(user["uid"], log_data)
    return {"status": "success", "id": res}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
