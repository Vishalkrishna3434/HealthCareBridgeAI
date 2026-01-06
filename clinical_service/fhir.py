from datetime import datetime
import uuid

def map_to_fhir_bundle(patient_id: str, entities: list, note_date: str = None) -> dict:
    """Maps extracted entities to a FHIR R4 Bundle."""
    timestamp = note_date or datetime.now().isoformat()
    
    bundle = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": []
    }
    
    # Add Patient reference or search
    # For MVP, we just create the entries for found entities
    
    for entity in entities:
        if entity["type"] == "CONDITION":
            bundle["entry"].append({
                "resource": {
                    "resourceType": "Condition",
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "code": {
                        "coding": [{"system": "http://snomed.info/sct", "code": entity["code"], "display": entity["text"]}]
                    },
                    "recordedDate": timestamp
                }
            })
        elif entity["type"] == "MEDICATION":
            bundle["entry"].append({
                "resource": {
                    "resourceType": "MedicationRequest",
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "medicationCodeableConcept": {
                        "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": entity["code"], "display": entity["text"]}]
                    },
                    "authoredOn": timestamp,
                    "status": "active"
                }
            })
            
    return bundle
