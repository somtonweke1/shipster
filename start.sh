#!/bin/bash

echo "Starting Shipster..."
echo ""
echo "Starting backend on http://localhost:3000..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 3

echo "Starting frontend on http://localhost:5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend running at http://localhost:3000"
echo "✓ Frontend running at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
