from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from nlp import analyze_clinical_text
from fhir import map_to_fhir_bundle
from events import publish_event

app = FastAPI(title="HealthBridge Clinical Intelligence")

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

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "clinical-intelligence"}

import os
import requests

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://healthbridge-ai:8082")

@app.post("/ingest")
async def ingest_note(note: ClinicalNote, background_tasks: BackgroundTasks):
    """Ingests a note, analyzes it via AI service, and triggers async processing."""
    try:
        # 1. Analyze via HealthBridge AI service
        ai_response = requests.post(
            f"{AI_SERVICE_URL}/analyze-note",
            json=note.dict(),
            timeout=30
        )
        if ai_response.status_code != 200:
            # Fallback to local NLP if AI service is down
            entities = analyze_clinical_text(note.note_text)
        else:
            ai_data = ai_response.json()
            # Extract entities from standardized AI response
            entities = []
            for cond in ai_data.get("extracted_entities", {}).get("conditions", []):
                entities.append({"text": cond["clinical_text"], "type": "CONDITION", "code": cond["icd_10"]})
            for med in ai_data.get("extracted_entities", {}).get("medications", []):
                entities.append({"text": med["drug_name"], "type": "MEDICATION", "code": med["rxnorm_code"]})
        
        # 2. Map to FHIR
        bundle = map_to_fhir_bundle(note.patient_id, entities, note.note_date)
        
        # 3. Publish Event (Async)
        background_tasks.add_task(publish_event, "fhir.created", bundle)
        
        return {
            "status": "success", 
            "message": "Note processed and FHIR bundle generated",
            "entities_detected": len(entities),
            "fhir_summary": f"Bundle with {len(bundle.get('entry', []))} resources"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
