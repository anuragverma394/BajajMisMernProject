
# Bajaj MIS Backend - Quick Start Guide

**TL;DR** - Get the backend running in 5 minutes.

---

## 5-Minute Quickstart

### Step 1: Configure Environment (2 min)

```bash
cd backend

# Copy template to actual config
cp .env.example .env

# Edit .env with your database credentials
# Update these lines:
# DB_SERVER=<your-sql-server>
# DB_USER=sa
# DB_PASSWORD=<your-password>
# DB_NAME=BajajCane2526
```

### Step 2: Start All Services (1 min)

**Windows:**
```batch
start-all.bat
```

**Unix/Linux/Mac:**
```bash
bash start-all.sh
```

**Or any platform:**
```bash
npm start
```

### Step 3: Verify Services Running (1 min)

```bash
# Check API Gateway health
curl http://localhost:5000/api/health

# Should see:
# {
#   "success": true,
#   "message": "api-gateway healthy",
#   "data": { "service": "api-gateway" }
# }
```

### Step 4: Done! ✅

Your backend is now running with:
- **API Gateway** on port 5000 (external entry point)
- **Auth Service** on port 5001
- **Report Service** on port 5004
- **10 total services** on ports 5000-5009

---

## Start Individual Services

Instead of all 10, start just what you need:

```bash
npm run start:gateway      # API Gateway only
npm run start:auth         # Auth Service only
npm run start:report       # Report Service only
npm run start:dashboard    # Dashboard Service only

# Or specific service by port
SERVICE_PORT=5001 node services/auth-service/server.js
```

---

## Test API

### Login

```bash
curl -X POST http://localhost:5000/api/account/login-2 \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "admin",
    "Password": "password",
    "season": "2526"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### Use Token for Protected Endpoint

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET http://localhost:5000/api/report/all \
  -H "Authorization: Bearer $TOKEN"
```

---

## Check Service Health

All services have health check on `/api/health`:

```bash
# Windows PowerShell
$ports = 5000..5009
$ports | ForEach-Object { 
  Write-Host "Port $_: $(curl -s http://localhost:$_/api/health | ConvertFrom-Json | Select -ExpandProperty message)"
}

# Unix/Linux
for port in {5000..5009}; do
  curl -s http://localhost:$port/api/health | jq '.message'
done
```

Expected output:
```
Port 5000: api-gateway healthy
Port 5001: auth-service healthy
Port 5002: user-service healthy
...
```

---

## Stop Services

**Windows:** Close the command windows or press `Ctrl+C`

**Unix/Linux:** 
```bash
bash stop-all.sh
```

Or press `Ctrl+C` in any terminal.

---

## Configuration

### Change Port

```bash
# Start Auth Service on different port
SERVICE_PORT=5011 npm run start:auth

# All services read from .env or SERVICE_PORT env var
```

### View Logs

**Unix/Linux** (if started with `bash start-all.sh`):
```bash
tail -f logs/auth-service.log
tail -f logs/report-service.log
```

**Windows** (if started with `start-all.bat`):
- Check the console window that opened for each service

---

## Common Issues

### "Port already in use"

```bash
# Windows - Find process using port 5001
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Unix - Find process using port 5001
lsof -i :5001
kill -9 <PID>
```

### "Cannot connect to database"

1. **Check credentials in .env**:
   ```bash
   DB_SERVER=localhost
   DB_USER=sa
   DB_PASSWORD=YourPassword
   ```

2. **Verify SQL Server is running**:
   ```bash
   # Windows - SQL Server should appear in Services
   sqlplus -h localhost -U sa
   ```

3. **Test connection**:
   ```bash
   node -e "const sql = require('mssql'); console.log(sql)"
   ```

### "CORS Error" in Frontend

Update `.env`:
```bash
CORS_ORIGINS=http://localhost:3000,http://yourdomain.com
```

Then restart API Gateway:
```bash
npm run start:gateway
```

### "401 Unauthorized"

Ensure:
1. JWT token is valid: `curl http://localhost:5001/api/health`
2. Token format correct: `Authorization: Bearer <token>`
3. Auth Service running: `curl http://localhost:5001/api/health`

---

## Next Steps

1. **Explore Documentation:**
   - `MICROSERVICES.md` - Full architecture guide
   - `PORT_ALLOCATION.md` - Port reference
   - `SECURITY_ANALYSIS.md` - Security details

2. **Development:**
   - Frontend connects to `http://localhost:5000`
   - API Gateway handles all authentication
   - Each service can be developed independently

3. **Deployment:**
   - See `MICROSERVICES.md` for production setup
   - Use PM2 for process management
   - Configure load balancer for multiple instances

---

## File Structure

```
backend/
├─ package.json               # npm scripts (start:gateway, start:auth, etc.)
├─ server.js                  # Master launcher (spawns all services)
├─ .env                        # ← Copy from .env.example, update with your values
├─ .env.example              # Configuration template
├─ start-all.bat             # Windows: start all services
├─ start-all.sh              # Unix/Linux: start all services
├─ stop-all.sh               # Unix/Linux: stop all services
│
├─ QUICKSTART.md             # This file
├─ MICROSERVICES.md          # Full documentation
├─ PORT_ALLOCATION.md        # Port reference
├─ IMPLEMENTATION_SUMMARY.md # What was changed
│
├─ shared/                    # Shared code (db, middleware, utils)
└─ services/
   ├─ api-gateway/           # Port 5000 - Entry point
   ├─ auth-service/          # Port 5001 - Authentication
   ├─ user-service/          # Port 5002 - User management
   ├─ dashboard-service/     # Port 5003 - Dashboard
   ├─ report-service/        # Port 5004 - Reports
   ├─ lab-service/           # Port 5005 - Lab operations
   ├─ survey-service/        # Port 5006 - Surveys
   ├─ tracking-service/      # Port 5007 - Tracking
   ├─ distillery-service/    # Port 5008 - Distillery
   └─ whatsapp-service/      # Port 5009 - WhatsApp integration
```

---

## Quick Commands

```bash
# Start everything
npm start

# Start one service
npm run start:gateway
npm run start:auth
npm run start:report
npm run start:dashboard

# Health check all services
curl http://localhost:5000/api/health
curl http://localhost:5001/api/health

# Stop all (Unix/Linux)
bash stop-all.sh

# Change a port
SERVICE_PORT=5015 npm run start:auth

# Watch logs (Unix/Linux)
tail -f logs/auth-service.log
```

---

## Architecture at a Glance

```
Client (React)
    ↓ http://localhost:3000
    ↓
Frontend calls API Gateway
    ↓ http://localhost:5000
    ↓
API Gateway
  • Verifies JWT
  • Routes requests
  • Manages CORS
    ↓
Internal Services (5001-5009)
  • Auth (5001)
  • Reports (5004)
  • Dashboard (5003)
  • Lab (5005)
  • etc.
    ↓
Database
  • SQL Server
  • Seasons: 2021-2526
```

---

## Getting Help

📖 **Read the docs in this order:**

1. **QUICKSTART.md** (you are here) - Get running in 5 min
2. **MICROSERVICES.md** - Full architecture guide
3. **PORT_ALLOCATION.md** - Port reference & troubleshooting
4. **IMPLEMENTATION_SUMMARY.md** - What was changed
5. **SECURITY_ANALYSIS.md** - Security details

---

## Need More?

- Full guide: See `MICROSERVICES.md`
- Port reference: See `PORT_ALLOCATION.md`
- Troubleshooting: See `MICROSERVICES.md` → Troubleshooting section
- Security: See `SECURITY_ANALYSIS.md`

---

**That's it! You're ready to go.** 🚀

For detailed info, read `MICROSERVICES.md`.
