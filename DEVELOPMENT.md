# TenantGuard Development Guide

## Quick Start for Local Development

This guide explains how to start both frontend and backend services for local development.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database running
- Redis server running

## Installation

First, install all dependencies for both frontend and backend:

```bash
# Using the root package.json script
npm run install:all

# Or manually
cd backend && npm install
cd ../frontend && npm install
```

## Starting Development Servers

You have two options to start both services:

### Option 1: Using npm script (Recommended)

```bash
# From the root directory
npm install  # Install concurrently (only needed once)
npm start    # Start both frontend and backend
```

This will:
- Start the backend (NestJS) on http://localhost:3000
- Start the frontend (React) on http://localhost:3001
- Show logs from both services in a single terminal with color-coded output

### Option 2: Using the shell script

```bash
# From the root directory
./start-dev.sh
```

This script will:
- Check if dependencies are installed
- Start backend in development mode (with hot-reload)
- Start frontend in development mode
- Automatically clean up processes when you press Ctrl+C

## Starting Services Individually

### Backend Only
```bash
cd backend
npm run start:dev
```
Backend will run on http://localhost:3000

### Frontend Only
```bash
cd frontend
npm start
```
Frontend will run on http://localhost:3001

## Other Useful Commands

### Build for Production
```bash
npm run build:all
```

### Run Tests
```bash
# Run all tests
npm run test:all

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

### Database Management
```bash
cd backend

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run db:seed

# Reset database
npm run prisma:reset
```

## Environment Variables

Make sure to set up your environment variables:

### Backend (.env)
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tenantguard"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
```

### Frontend (.env)
Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:3000
```

## Troubleshooting

### Port Already in Use
If you get a port conflict:
- Backend: Change the port in `backend/src/main.ts`
- Frontend: Set `PORT=3002` in `frontend/.env`

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL in backend/.env
- Run migrations: `cd backend && npm run prisma:migrate`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_HOST and REDIS_PORT in backend/.env

## Development Workflow

1. Make sure PostgreSQL and Redis are running
2. Start both services using `npm start` or `./start-dev.sh`
3. Backend API will be available at http://localhost:3000
4. Frontend will be available at http://localhost:3001
5. Changes to code will automatically reload (hot-reload enabled)
6. Press Ctrl+C to stop all services

## API Documentation

Once the backend is running, you can access:
- Swagger API docs: http://localhost:3000/api/docs (if configured)
- Health check: http://localhost:3000/health (if configured)

---

Happy coding! 🚀
