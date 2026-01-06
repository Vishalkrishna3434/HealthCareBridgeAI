# from google.cloud import language_v1
# Note: In production, use google-cloud-healthcare for specialized medical NLP

def analyze_clinical_text(text: str) -> list:
    """Calls Google Healthcare NLP API to extract entities."""
    # Simulation for MVP
    entities = []
    
    # Simple rule-based extraction for demo purposes
    if "diabetes" in text.lower():
        entities.append({"text": "diabetes", "type": "CONDITION", "code": "73211009"})
    if "metformin" in text.lower():
        entities.append({"text": "Metformin", "type": "MEDICATION", "code": "6809"})
    if "lisinopril" in text.lower():
        entities.append({"text": "Lisinopril", "type": "MEDICATION", "code": "29046"})
    if "aspirin" in text.lower():
        entities.append({"text": "Aspirin", "type": "MEDICATION", "code": "1191"})
        
    return entities
