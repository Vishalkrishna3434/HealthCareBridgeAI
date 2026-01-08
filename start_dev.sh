#!/bin/bash

# Kill any running python uvicorn processes to avoid port conflicts (optional, be careful)
# pkill -f "uvicorn api.index:app"

echo "Starting Backend..."
python3 -m uvicorn api.index:app --reload --port 8000 &
BACKEND_PID=$!

echo "Waiting for Backend to start..."
sleep 5

echo "Starting Frontend..."
cd frontend
npm run dev

# Cleanup function to kill backend when script exits
cleanup() {
    echo "Stopping Backend..."
    kill $BACKEND_PID
}
trap cleanup EXIT
