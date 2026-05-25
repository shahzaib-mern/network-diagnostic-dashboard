#!/bin/bash
echo "🚀 NetPulse — Network Diagnostics Dashboard"
echo "==========================================="

# Start backend
echo "📡 Starting backend on port 3001..."
cd backend && npm install --silent && node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend on port 5173..."
cd ../frontend && npm install --silent && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ NetPulse is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
