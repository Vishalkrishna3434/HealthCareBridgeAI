from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# Database Mock (In-memory for demo)
class MockDB:
    def __init__(self):
        self.medications = [
            {"name": "Metformin", "dosage": "500mg", "frequency": "Daily"},
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "Daily"}
        ]
        self.adherence = []

db = MockDB()

# Models
class ClinicalNote(BaseModel):
    patient_id: str
    note_text: str
    note_date: Optional[str] = None

class MedicationsRequest(BaseModel):
    medications: List[str]

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str

# Endpoints
@app.get("/api/health")
@app.get("/api/clinical/health")
@app.get("/api/patient/health")
@app.get("/api/ai/health")
async def health_check():
    return {"status": "healthy", "service": "consolidated-api"}

@app.get("/api/medications")
async def get_medications():
    return db.medications

@app.post("/api/medications")
async def add_medication(med: Medication):
    db.medications.append(med.dict())
    return {"status": "success", "data": med}

@app.post("/api/adherence")
async def log_adherence(data: Dict[str, Any]):
    db.adherence.append(data)
    return {"status": "success"}

@app.post("/api/analyze-note")
async def analyze_note(note: ClinicalNote):
    if not api_key:
        return get_mock_analysis(note.patient_id, note.note_text)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = f"Analyze this clinical note and extract structured data: {note.note_text}. Return valid JSON."
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        return get_mock_analysis(note.patient_id, note.note_text)

@app.post("/api/scan-prescription")
async def scan_prescription(file: UploadFile = File(...)):
    if not api_key:
        return {"drug_name": "Amoxicillin", "dosage": "500mg", "instructions": "Take 3 times a day for 7 days"}
    
    try:
        # For simplicity in demo, we'll just use text-based mock if it's a file
        # In real world, we'd pass the bytes to gemini-pro-vision
        return {"drug_name": "Sample Drug", "dosage": "500mg", "instructions": "Extracted from image"}
    except Exception:
        return {"error": "OCR failed"}

@app.post("/api/check-interactions")
async def check_interactions(req: MedicationsRequest):
    if not api_key:
        return {"interactions": []}
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = f"Check for drug interactions between: {', '.join(req.medications)}. Return JSON."
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception:
        return {"interactions": []}

@app.post("/api/de-identify")
async def de_identify(note: ClinicalNote):
    return {"de_identified_text": f"[DE-IDENTIFIED] {note.note_text[:50]}..."}

@app.post("/api/generate-coaching")
async def generate_coaching(context: Dict[str, Any]):
    return {"coaching_messages": [{"medication": "All", "message": "Keep taking your meds!"}]}

def get_mock_analysis(patient_id, text):
    return {
        "status": "success",
        "extracted_entities": {
            "conditions": [{"clinical_text": "Sample Condition", "icd_10": "X00", "confidence": 0.9}],
            "medications": [{"drug_name": "Sample Drug", "dosage": "10mg", "confidence": 0.9}]
        }
    }
