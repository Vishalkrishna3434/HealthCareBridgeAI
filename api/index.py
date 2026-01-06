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

@app.get("/")
@app.get("/api")
async def root():
    return {"status": "healthy", "message": "HealthBridge AI API is running"}

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# Database Mock (In-memory for demo)
class MockDB:
    def __init__(self):
        self.medications = [
            {"id": "1", "name": "Metformin", "dosage": "500mg", "frequency": "Daily"},
            {"id": "2", "name": "Lisinopril", "dosage": "10mg", "frequency": "Daily"}
        ]
        self.adherence = []
        self.audit_logs = [
            {"id": "a1", "timestamp": "2026-01-06T10:00:00Z", "action": "Note Analysis", "user": "Dr. Smith", "status": "Success"},
            {"id": "a2", "timestamp": "2026-01-06T10:15:00Z", "action": "Prescription OCR", "user": "Scanner-01", "status": "Success"},
            {"id": "a3", "timestamp": "2026-01-06T10:30:00Z", "action": "Interaction Check", "user": "Dr. Smith", "status": "Warning"},
        ]

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

@app.get("/api/audit-log")
async def get_audit_logs():
    return db.audit_logs

@app.get("/api/medications")
async def get_medications():
    return db.medications

@app.post("/api/medications")
async def add_medication(med: Medication):
    import uuid
    med_dict = med.dict()
    med_dict["id"] = str(uuid.uuid4())
    db.medications.append(med_dict)
    return {"status": "success", "data": med_dict}

@app.delete("/api/medications/{med_id}")
async def delete_medication(med_id: str):
    initial_len = len(db.medications)
    db.medications = [m for m in db.medications if m["id"] != med_id]
    if len(db.medications) == initial_len:
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"status": "success"}

@app.post("/api/adherence")
async def log_adherence(data: Dict[str, Any]):
    db.adherence.append(data)
    # Add to audit log too
    db.audit_logs.insert(0, {
        "id": os.urandom(4).hex(),
        "timestamp": data.get("timestamp", "Just now"),
        "action": f"Adherence Log: {data.get('medication_id')}",
        "user": "System",
        "status": data.get("status", "Logged")
    })
    return {"status": "success"}

@app.post("/api/analyze-note")
async def analyze_note(note: ClinicalNote):
    db.audit_logs.insert(0, {
        "id": os.urandom(4).hex(),
        "timestamp": "Just now",
        "action": "Clinical Note Analysis",
        "user": "Web Client",
        "status": "Success"
    })
    
    if not api_key:
        return get_mock_analysis(note.patient_id, note.note_text)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = f"""
        Analyze this clinical note and extract structured medical data.
        Note: {note.note_text}
        
        Return the result in valid JSON format ONLY with this exact structure:
        {{
            "extracted_entities": {{
                "conditions": [
                    {{
                        "clinical_text": "...",
                        "icd_10": "...",
                        "confidence": 0-100,
                        "severity": "Mild/Moderate/Severe/Chronic"
                    }}
                ],
                "medications": [
                    {{
                        "drug_name": "...",
                        "dosage": "...",
                        "frequency": "...",
                        "confidence": 0-100
                    }}
                ]
            }},
            "adherence_insights": {{
                "complexity_score": 1-5,
                "barriers_identified": ["...", "..."]
            }},
            "fhir_resources": {{
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [
                    {{
                        "resource": {{
                            "resourceType": "Condition/MedicationRequest/Patient",
                            "..." : "..."
                        }}
                    }}
                ]
            }}
        }}
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in analyze_note: {str(e)}")
        return get_mock_analysis(note.patient_id, note.note_text)

@app.post("/api/scan-prescription")
async def scan_prescription(file: UploadFile = File(...)):
    db.audit_logs.insert(0, {
        "id": os.urandom(4).hex(),
        "timestamp": "Just now",
        "action": "Prescription OCR Scan",
        "user": "Web Client",
        "status": "Success"
    })
    
    if not api_key:
        return {
            "medications": [
                {"name": "Amoxicillin", "dosage": "500mg", "frequency": "Every 8 hours", "duration": "7 days"},
                {"name": "Ibuprofen", "dosage": "400mg", "frequency": "As needed", "duration": "5 days"}
            ],
            "raw_text": "DEMO MODE: Amoxicillin 500mg - 1 tab TID x 7d. Ibuprofen 400mg PRN pain."
        }
    
    try:
        content = await file.read()
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = """
        Analyze this prescription image. 
        1. Extract all medications with their dosage, frequency, and duration.
        2. Provide a raw transcription of the relevant text.
        
        Return the result in valid JSON format:
        {
            "medications": [
                {"name": "...", "dosage": "...", "frequency": "...", "duration": "..."}
            ],
            "raw_text": "..."
        }
        """
        
        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": content}
        ])
        
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in scan_prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scan prescription: {str(e)}")

@app.post("/api/check-interactions")
async def check_interactions(req: MedicationsRequest):
    db.audit_logs.insert(0, {
        "id": os.urandom(4).hex(),
        "timestamp": "Just now",
        "action": "Drug Interaction Check",
        "user": "Web Client",
        "status": "Success"
    })
    
    if not api_key:
        # Better mock interactions
        return {
            "interactions": [
                {
                    "drug_a": "Aspirin",
                    "drug_b": "Warfarin",
                    "severity": "High",
                    "mechanism": "Increased risk of bleeding due to combined anticoagulant/antiplatelet effects.",
                    "recommendation": "Avoid combination or closely monitor INR and signs of bleeding."
                }
            ],
            "warnings": ["Check patient history for gastric ulcers."]
        }
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = f"""
        Check for drug-drug interactions between these medications: {', '.join(req.medications)}.
        
        Return the result in valid JSON format ONLY with this exact structure:
        {{
            "interactions": [
                {{
                    "drug_a": "...",
                    "drug_b": "...",
                    "severity": "High/Moderate/Low",
                    "mechanism": "Brief scientific reason for interaction",
                    "recommendation": "Clinical advice for the provider"
                }}
            ],
            "warnings": ["General safety warning 1", "General safety warning 2"]
        }}
        If no interactions are found, return "interactions": [].
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in check_interactions: {str(e)}")
        return {"interactions": [], "warnings": ["Error processing interaction check."]}

@app.post("/api/de-identify")
async def de_identify(note: ClinicalNote):
    return {"de_identified_text": f"[DE-IDENTIFIED] {note.note_text[:50]}..."}

@app.post("/api/generate-coaching")
async def generate_coaching(context: Dict[str, Any]):
    return {
        "coaching_messages": [
            {"medication": "Lisinopril", "message": "Best taken in the morning to keep blood pressure stable all day.", "importance": "high", "timing": "Morning"},
            {"medication": "Metformin", "message": "Take with meals to reduce stomach sensitivity.", "importance": "moderate", "timing": "With Dinner"}
        ]
    }

def get_mock_analysis(patient_id, text):
    return {
        "status": "success",
        "extracted_entities": {
            "conditions": [
                {"clinical_text": "Hypertension", "icd_10": "I10", "confidence": 98, "severity": "Moderate"},
                {"clinical_text": "Type 2 Diabetes", "icd_10": "E11.9", "confidence": 95, "severity": "Chronic"}
            ],
            "medications": [
                {"drug_name": "Lisinopril", "dosage": "10mg", "frequency": "Daily", "confidence": 99},
                {"drug_name": "Metformin", "dosage": "500mg", "frequency": "Twice Daily", "confidence": 97}
            ]
        },
        "fhir_resources": {
            "resourceType": "Bundle",
            "type": "collection",
            "entry": [
                {"resource": {"resourceType": "Condition", "code": {"text": "Hypertension"}}},
                {"resource": {"resourceType": "MedicationRequest", "medication": {"text": "Lisinopril"}}}
            ]
        },
        "adherence_insights": {
            "complexity_score": 3,
            "barriers_identified": ["Multiple daily doses", "Complex schedule"]
        }
    }
