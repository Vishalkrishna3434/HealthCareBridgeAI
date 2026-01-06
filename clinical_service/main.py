import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os

app = FastAPI(title="HealthBridge Clinical Intelligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NLP & FHIR Logic ---
def analyze_clinical_text(text: str) -> list:
    entities = []
    if "diabetes" in text.lower(): entities.append({"text": "Diabetes", "type": "CONDITION", "code": "E11.9"})
    if "metformin" in text.lower(): entities.append({"text": "Metformin", "type": "MEDICATION", "code": "6809"})
    return entities

def map_to_fhir_bundle(patient_id: str, entities: list, date: str = None) -> dict:
    entries = []
    now = date or datetime.now().isoformat()
    for entity in entities:
        if entity["type"] == "CONDITION":
            resource = {"resourceType": "Condition", "subject": {"reference": f"Patient/{patient_id}"}, "code": {"coding": [{"system": "http://snomed.info/sct", "code": entity.get("code")}], "text": entity["text"]}, "onsetDateTime": now}
        else:
            resource = {"resourceType": "MedicationRequest", "subject": {"reference": f"Patient/{patient_id}"}, "medicationCodeableConcept": {"coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": entity.get("code")}], "text": entity["text"]}, "authoredOn": now}
        entries.append({"resource": resource, "request": {"method": "POST", "url": resource["resourceType"]}})
    return {"resourceType": "Bundle", "id": str(uuid.uuid4()), "type": "transaction", "entry": entries}

# --- Endpoints ---
class ClinicalNote(BaseModel):
    patient_id: str
    note_text: str
    note_date: Optional[str] = None

@app.get("/health")
def health_check(): return {"status": "healthy", "service": "clinical-intelligence"}

@app.post("/ingest")
async def ingest_note(note: ClinicalNote, background_tasks: BackgroundTasks):
    AI_URL = "http://healthbridge-ai:8082" if os.getenv("DOCKER_ENV") == "true" else "http://localhost:8082"
    try:
        async with httpx.AsyncClient() as client:
            ai_resp = await client.post(f"{AI_URL}/analyze-note", json=note.dict(), timeout=30.0)
            if ai_resp.status_code == 200:
                ai_data = ai_resp.json()
                entities = [{"text": c["clinical_text"], "type": "CONDITION", "code": c["icd_10"]} for c in ai_data.get("extracted_entities", {}).get("conditions", [])]
                entities += [{"text": m["drug_name"], "type": "MEDICATION", "code": m["rxnorm_code"]} for m in ai_data.get("extracted_entities", {}).get("medications", [])]
            else:
                entities = analyze_clinical_text(note.note_text)
        
        bundle = map_to_fhir_bundle(note.patient_id, entities, note.note_date)
        print(f"[Event] FHIR Bundle Created: {bundle['id']}")
        return {"status": "success", "entities_extracted": len(entities), "fhir_bundle_preview": bundle.get("id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
