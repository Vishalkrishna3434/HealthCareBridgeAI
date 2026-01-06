import json

def publish_adherence_event(user_id: str, event_data: dict):
    """Publishes adherence event to mock Pub/Sub."""
    message = {
        "event_type": "medication.adherence",
        "user_id": user_id,
        "data": event_data,
        "timestamp": event_data.get("timestamp")
    }
    
    # Simulation
    print(f"[Pub/Sub] Published adherence event: {json.dumps(message)}")
    return "msg_id_adherence_123"
