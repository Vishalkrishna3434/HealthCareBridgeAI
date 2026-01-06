import json

def publish_event(event_type: str, data: dict):
    """Publishes event to mock Pub/Sub."""
    # Simulation
    print(f"[Internal] Event Published: {event_type}")
    # In production: publisher.publish(topic_path, json.dumps(data).encode("utf-8"))
    return True
