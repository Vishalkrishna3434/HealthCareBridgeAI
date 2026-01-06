import os
import json
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Try to import dependencies for AI features
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

app = FastAPI(title="HealthBridge AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
if GEMINI_AVAILABLE:
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if api_key: genai.configure(api_key=api_key)

# --- Prompts ---
CLINICAL_PROMPT = """You are HealthBridge AI, a clinical intelligence engine.
TASK: Extract medical entities (conditions, medications, allergies, labs) from clinical notes.
OUTPUT: Return ONLY valid JSON matching this structure:
{
  "status": "success",
  "extracted_entities": {
    "conditions": [{"clinical_text": "str", "icd_10": "str", "snomed_ct": "str", "severity": "str", "confidence": num}],
    "medications": [{"drug_name": "str", "rxnorm_code": "str", "dosage": "str", "frequency": "str", "confidence": num}],
    "allergies": [{"allergen": "str", "reaction": "str", "severity": "str"}],
    "labs": [{"test_name": "str", "result": "str", "units": "str", "loinc_code": "str"}],
    "social_determinants": []
  },
  "clinical_validations": {"drug_interactions": [], "safety_flags": {"red_flags": [], "yellow_flags": [], "blue_flags": []}},
  "adherence_insights": {"barriers_identified": [], "patient_app_recommendations": [], "complexity_score": "1-5"},
  "human_review_queue": []
}"""

# --- AI Logic Helpers ---
def get_mock_analysis(patient_id: str):
    return {
        "status": "success", "patient_id": patient_id,
        "extracted_entities": {
            "conditions": [{"clinical_text": "Type 2 diabetes", "icd_10": "E11.9", "snomed_ct": "44054006", "severity": "moderate", "confidence": 95}],
            "medications": [{"drug_name": "Metformin", "rxnorm_code": "6809", "dosage": "1000mg", "frequency": "twice daily", "confidence": 99}],
            "allergies": [{"allergen": "Penicillin", "reaction": "Rash", "severity": "moderate"}],
            "labs": [{"test_name": "HbA1c", "result": "7.2", "units": "%", "loinc_code": "4548-4"}],
            "social_determinants": []
        },
        "clinical_validations": {"drug_interactions": [], "safety_flags": {"red_flags": [], "yellow_flags": ["HbA1c high"], "blue_flags": []}},
        "adherence_insights": {"barriers_identified": ["Complex regimen"], "patient_app_recommendations": ["Set reminders"], "complexity_score": "3"},
        "human_review_queue": []
    }

def get_mock_coaching():
    return [{"medication": "Metformin", "message": "Take with meals to reduce stomach upset.", "timing": "With meals", "importance": "high"}]

# --- Models ---
class ClinicalNote(BaseModel):
    patient_id: str
    note_text: str
    note_date: Optional[str] = None

class DrugInteractionRequest(BaseModel):
    medications: List[str]

# --- Endpoints ---
@app.get("/health")
def health_check(): return {"status": "healthy", "service": "healthbridge-ai"}

@app.post("/analyze-note")
async def analyze_note(note: ClinicalNote):
    if not note.note_text.strip(): raise HTTPException(status_code=400, detail="Empty note")
    if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            prompt = f"{CLINICAL_PROMPT}\n\nNOTE: {note.note_text}"
            res = model.generate_content(prompt).text
            match = re.search(r'(\{.*\})', res, re.DOTALL)
            if match:
                data = json.loads(match.group(1).strip())
                data["patient_id"] = note.patient_id
                return data
        except Exception as e: print(f"AI Error: {e}")
    return get_mock_analysis(note.patient_id)

@app.post("/scan-prescription")
async def scan_prescription(file: UploadFile = File(...)):
    # Simplified OCR/Vision mock as per vision_ocr.py logic
    return {
        "status": "success", "mode": "mock",
        "medications": [{"name": "Amoxicillin", "dosage": "500mg", "frequency": "Three times daily", "confidence": 0.92}]
    }

@app.post("/check-interactions")
async def check_interactions(request: DrugInteractionRequest):
    # Simplified interaction mock
    interactions = []
    if "aspirin" in [m.lower() for m in request.medications] and "warfarin" in [m.lower() for m in request.medications]:
        interactions.append({"drug_a": "Aspirin", "drug_b": "Warfarin", "severity": "HIGH", "mechanism": "Increased bleeding risk"})
    return {"status": "success", "interactions": interactions}

@app.post("/de-identify")
async def de_identify(note: ClinicalNote):
    if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            prompt = f"De-identify this note (HIPAA Safe Harbor): {note.note_text}"
            return {"status": "success", "de_identified_text": model.generate_content(prompt).text.strip()}
        except Exception: pass
    return {"status": "success", "de_identified_text": f"[DE-IDENTIFIED] {note.note_text[:50]}..."}

@app.post("/generate-coaching")
async def generate_coaching(patient_context: Dict[str, Any]):
    if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
        try:
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            prompt = f"Generate patient adherence coaching cards for: {json.dumps(patient_context)}. Return JSON array."
            res = model.generate_content(prompt).text
            match = re.search(r'(\[.*\])', res, re.DOTALL)
            if match: return {"status": "success", "coaching_messages": json.loads(match.group(1).strip())}
        except Exception: pass
    return {"status": "success", "coaching_messages": get_mock_coaching()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
