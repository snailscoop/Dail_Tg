#!/bin/bash

# Run all components for Dail Telegram application with enhanced features
# DataTrust Vault (Verida) and ConsentChain (Cheqd)

echo "Starting all services for Dail Telegram enhanced application..."

# Check if backend.env exists
if [ ! -f backend.env ]; then
  echo "Error: backend.env file not found. Please create it with your API keys."
  echo "Required variables: CHEQD_API_KEY, VERIDA_PRIVATE_KEY"
  exit 1
fi

# Start Gun server in background
echo "Starting Gun server..."
node gun-server.js &
GUN_PID=$!
echo "Gun server started with PID: $GUN_PID"

# Give the Gun server a moment to start
sleep 2

# Start enhanced backend server in background
echo "Starting enhanced backend server..."
node enhanced-backend.js &
BACKEND_PID=$!
echo "Enhanced backend server started with PID: $BACKEND_PID"

# Give the backend server a moment to start
sleep 3

# Start Telegram bot in background
echo "Starting Telegram bot..."
node index.js &
BOT_PID=$!
echo "Telegram bot started with PID: $BOT_PID"

# Check if the bot started successfully
sleep 2
if ! ps -p $BOT_PID > /dev/null; then
  echo "Error: Telegram bot failed to start."
  echo "Shutting down services..."
  kill $GUN_PID
  kill $BACKEND_PID
  exit 1
fi

# Start React frontend if it exists
if [ -d "dail-tg" ]; then
  echo "Starting React frontend..."
  cd dail-tg && npm start &
  FRONTEND_PID=$!
  cd ..
  echo "React frontend started with PID: $FRONTEND_PID"
fi

# Function to cleanup background processes
cleanup() {
  echo "Shutting down all services..."
  kill $GUN_PID 2>/dev/null || true
  kill $BACKEND_PID 2>/dev/null || true
  kill $BOT_PID 2>/dev/null || true
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  echo "All services stopped."
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "All services are running!"
echo "Press Ctrl+C to stop all services."

# Keep script running until user terminates
wait 