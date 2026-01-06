FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir functions-framework

COPY . .

# Default command for Cloud Run / Production
CMD ["functions-framework", "--target=ingest_adherence_event", "--signature-type=event", "--port=8080"]
