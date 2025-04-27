#!/bin/bash

# Run all components for Dail Telegram application

echo "Starting all services for Dail Telegram application..."

# Start Gun server in background
echo "Starting Gun server..."
node gun-server.js &
GUN_PID=$!
echo "Gun server started with PID: $GUN_PID"

# Give the Gun server a moment to start
sleep 2

# Start backend server in background
echo "Starting backend server..."
node backend-server.js &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Give the backend server a moment to start
sleep 2

# Start React frontend
echo "Starting React frontend..."
cd dail-tg && npm start

# When the React app is terminated, also kill the background processes
cleanup() {
  echo "Shutting down all services..."
  kill $GUN_PID
  kill $BACKEND_PID
  echo "All services stopped."
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Wait for user to terminate the script
wait 