from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from gemini_client import analyze_clinical_note, check_drug_interactions
from vision_ocr import extract_prescription_data

app = FastAPI(title="HealthBridge AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClinicalNote(BaseModel):
    patient_id: str
    note_text: str
    note_date: Optional[str] = None

class MedicationsRequest(BaseModel):
    medications: List[str]

@app.get("/")
def root():
    return {"status": "HealthBridge AI is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "healthbridge-ai"}

@app.post("/analyze-note")
async def analyze_note(note: ClinicalNote):
    return await analyze_clinical_note(note.patient_id, note.note_text, note.note_date)

@app.post("/scan-prescription")
async def scan_prescription(file: UploadFile = File(...)):
    return await extract_prescription_data(await file.read())

@app.post("/check-interactions")
async def check_interactions(req: MedicationsRequest):
    return await check_drug_interactions(req.medications)

@app.post("/de-identify")
async def de_identify(note: ClinicalNote):
    from gemini_client import de_identify_note
    return {"status": "success", "de_identified_text": await de_identify_note(note.note_text)}

@app.post("/generate-coaching")
async def generate_coaching(patient_context: Dict[str, Any]):
    from gemini_client import generate_patient_coaching
    return {"status": "success", "coaching_messages": await generate_patient_coaching(patient_context)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
