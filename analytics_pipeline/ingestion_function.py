import base64
import json
import os
# from google.cloud import bigquery

# Client simulation
# client = bigquery.Client()

def ingest_adherence_event(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic."""
    try:
        if 'data' in event:
            pubsub_message = base64.b64decode(event['data']).decode('utf-8')
            message_json = json.loads(pubsub_message)
            
            print(f"Processing event: {message_json['event_type']}")
            
            # Transform for BigQuery
            row = {
                "event_id": context.event_id,
                "user_id": message_json.get("user_id"),
                "medication_id": message_json.get("data", {}).get("medication_id"),
                "status": message_json.get("data", {}).get("status"),
                "timestamp": message_json.get("timestamp"),
                "ingested_at": "2023-10-27T10:00:00Z" # datetime.now().isoformat()
            }
            
            # Insert into BigQuery (Simulated)
            # table_id = f"{os.environ['GCP_PROJECT']}.healthbridge_analytics.adherence_logs"
            # errors = client.insert_rows_json(table_id, [row])
            
            print(f"[BigQuery] Inserted row: {row}")
            return "Success"
            
    except Exception as e:
        print(f"Error: {e}")
        raise
