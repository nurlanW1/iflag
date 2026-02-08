# Troubleshooting Guide

## ERR_CONNECTION_REFUSED Error

### Problem
Cannot connect to http://localhost:3000 - Connection refused

### Solution

#### Step 1: Start the Frontend Server

Open a terminal and run:

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

You should see output like:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Ready in 2.3s
```

#### Step 2: Check if Port 3000 is Available

If port 3000 is already in use, Next.js will automatically use the next available port (3001, 3002, etc.)

To check what's using port 3000:
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

#### Step 3: Start All Services

To start everything at once:

```bash
# From root directory
# 1. Start database
docker-compose up -d

# 2. Start backend (in new terminal)
cd apps/backend
npm install
npm run dev

# 3. Start frontend (in new terminal)
cd apps/frontend
npm install
npm run dev
```

---

## Common Issues

### Issue 1: Dependencies Not Installed

**Error**: Module not found or missing dependencies

**Solution**:
```bash
# Install all dependencies
npm install

# Or from root
npm install --workspaces
```

### Issue 2: Port Already in Use

**Error**: Port 3000 is already in use

**Solution**:
```bash
# Option 1: Use different port
cd apps/frontend
PORT=3001 npm run dev

# Option 2: Kill process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Issue 3: Database Not Running

**Error**: Backend can't connect to database

**Solution**:
```bash
# Start database
docker-compose up -d

# Check if running
docker ps

# Check logs
docker-compose logs db
```

### Issue 4: Backend Not Running

**Error**: Frontend can't connect to backend API

**Solution**:
```bash
# Start backend
cd apps/backend
npm run dev

# Should see: "🚀 Flag Stock Marketplace Backend API listening on port 4000"
```

### Issue 5: CORS Errors

**Error**: CORS policy blocked

**Solution**:
1. Check backend `.env` file has:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

2. Check frontend `.env.local` has:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

---

## Quick Start Script

Create a file `start-dev.sh` (Mac/Linux) or `start-dev.bat` (Windows):

### Windows (start-dev.bat)
```batch
@echo off
echo Starting Flag Stock Marketplace...

echo Starting database...
docker-compose up -d

echo Waiting for database...
timeout /t 5

echo Starting backend...
start cmd /k "cd apps/backend && npm run dev"

echo Starting frontend...
start cmd /k "cd apps/frontend && npm run dev"

echo All services starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000
pause
```

### Mac/Linux (start-dev.sh)
```bash
#!/bin/bash
echo "Starting Flag Stock Marketplace..."

echo "Starting database..."
docker-compose up -d

echo "Waiting for database..."
sleep 5

echo "Starting backend..."
cd apps/backend && npm run dev &

echo "Starting frontend..."
cd apps/frontend && npm run dev &

echo "All services starting..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
```

---

## Verification Steps

1. **Check Database**:
   ```bash
   docker ps
   # Should see 'db' container running
   ```

2. **Check Backend**:
   ```bash
   curl http://localhost:4000/health
   # Should return: {"status":"healthy","database":"connected"}
   ```

3. **Check Frontend**:
   - Open browser: http://localhost:3000
   - Should see the application

---

## Still Having Issues?

1. Check all terminal windows for error messages
2. Verify Node.js version: `node --version` (should be 18+)
3. Verify npm version: `npm --version`
4. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
