#!/bin/bash

# TenantGuard Local Development Starter Script
# This script starts both frontend and backend services

echo "🚀 Starting TenantGuard Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend && npm install && cd ..
fi

# Start backend in background
echo -e "${BLUE}🔧 Starting Backend (NestJS) on http://localhost:3000...${NC}"
cd backend && npm run start:debug &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
echo -e "${BLUE}🎨 Starting Frontend (React) on http://localhost:3001...${NC}"
cd frontend && BROWSER=none npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Development servers are starting!${NC}"
echo ""
echo "📍 Backend API: http://localhost:3000"
echo "📍 Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping development servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    
    # Kill any remaining node processes for our apps
    pkill -f "nest start" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for background processes
wait
