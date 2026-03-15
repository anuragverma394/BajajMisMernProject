# Backend Setup & Installation Guide

**Date**: March 2026  
**Applies To**: Bajaj MERN Backend Monorepo  

---

## Quick Start (5 minutes)

### Prerequisites
- ✅ Node.js v16+ installed
- ✅ npm v8+ installed

### One-Time Setup

**Option 1: Windows (Recommended)**
```bash
cd a:\vibrant technology\Bajaj Project06022026\Bajaj Project\BajajMisMernProject\backend
setup.bat
```

**Option 2: Linux/Mac**
```bash
cd backend
chmod +x setup.sh
bash setup.sh
```

**Option 3: Manual**
```bash
cd backend
npm install
```

That's it! The workspace dependencies will be linked automatically.

---

## What is Happening?

This is a **monorepo setup with npm workspaces**. The structure:

```
backend/
├── package.json (root workspace config)
├── node_modules/ (shared dependencies)
├── shared/ (shared package: @bajaj/shared)
└── services/
    ├── user-service/
    ├── auth-service/
    ├── dashboard-service/
    ├── report-service/
    ├── tracking-service/
    ├── survey-service/
    ├── lab-service/
    ├── distillery-service/
    └── whatsapp-service/
```

### How Workspaces Work

**Root package.json:**
```json
{
  "name": "bajaj-backend",
  "workspaces": [
    "shared",
    "services/*"
  ]
}
```

**Service package.json:**
```json
{
  "name": "user-service",
  "dependencies": {
    "@bajaj/shared": "workspace:*"
  }
}
```

When you run `npm install` in the root, npm:
1. Installs root dependencies
2. Installs all workspace dependencies
3. Creates links for local packages (like @bajaj/shared)
4. Services can then require `@bajaj/shared`

---

## Why Was There an Error?

Error:
```
Error: Cannot find module '@bajaj/shared'
```

**Causes:**
- ❌ `npm install` not run at the root level
- ❌ node_modules not properly set up
- ❌ Workspace links not established
- ❌ Old/corrupted node_modules

---

## Step-by-Step Fix

### Step 1: Navigate to Backend Root
```bash
cd a:\vibrant technology\Bajaj Project06022026\Bajaj Project\BajajMisMernProject\backend
```

### Step 2: Clean (if needed)
```bash
# Remove old dependencies
rmdir /s node_modules          # Windows
rm -rf node_modules            # Linux/Mac

# Remove lock file
del package-lock.json          # Windows
rm package-lock.json           # Linux/Mac
```

### Step 3: Install Dependencies
```bash
npm install
```

This will:
- ✅ Read root `package.json`
- ✅ See `"workspaces": ["shared", "services/*"]`
- ✅ Install all workspace dependencies
- ✅ Create symlinks for local packages
- ✅ Link @bajaj/shared to all services

### Step 4: Verify Setup
```bash
# Check if @bajaj/shared is linked
ls node_modules/@bajaj/shared          # Linux/Mac
dir node_modules\@bajaj\shared         # Windows

# Output should show files from shared/ directory
```

---

## Starting the Backend

### Option 1: Start All Services
```bash
npm start
```

This runs the root `start.js` which launches all services.

### Option 2: Start Specific Service
```bash
cd services/user-service
npm start
```

### Option 3: Development Mode (with auto-reload)
```bash
cd services/user-service
npm run dev
```

---

## Troubleshooting

### Error: "Cannot find module '@bajaj/shared'"

**Problem**: Workspace links not established

**Solution**:
```bash
# 1. Go to backend root
cd backend

# 2. Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Verify
ls node_modules/@bajaj/shared
```

### Error: "npm: command not found"

**Problem**: Node/npm not installed

**Solution**:
- Download from https://nodejs.org (LTS version)
- Install Node.js (includes npm)
- Restart terminal
- Verify: `npm --version`

### Error: "Node version too old"

**Problem**: Using Node.js < v16

**Solution**:
```bash
# Check version
node --version

# Need v16+, preferably v18+
# Update from https://nodejs.org
```

### Error: "Permission denied" (Linux/Mac)

**Problem**: Missing execute permission

**Solution**:
```bash
chmod +x setup.sh
bash setup.sh
```

### Services still won't start

**Debug steps**:
```bash
# 1. Check workspace setup
npm ls -a @bajaj/shared

# 2. Verify shared package exists
ls shared/package.json

# 3. Check for errors
npm install --verbose 2>&1 | tail -20

# 4. Try hard reset
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Project Structure

### Root Level
```
backend/
├── package.json              # Workspace root config
├── package-lock.json         # Dependency lock file
├── server.js / start.js      # Entry point to start all services
├── node_modules/             # All dependencies installed here
│   └── @bajaj/
│       └── shared/           # Symlink to shared/
└── shared/                   # Shared package
    ├── package.json
    ├── index.js
    └── ...
```

### Shared Package
```
shared/
├── package.json              # @bajaj/shared package config
├── index.js                  # Main export
├── core/                     # Core utilities
├── middleware/               # Express middleware
├── http/                     # HTTP utilities
├── db/                       # Database utilities
├── utils/                    # General utilities
└── config/                   # Configuration
```

### Services
```
services/
├── user-service/
│   ├── package.json          # Depends on @bajaj/shared
│   ├── server.js
│   ├── app.js
│   ├── src/
│   └── ...
├── auth-service/
│   └── ...
├── dashboard-service/
│   └── ...
└── [8 total services]
```

---

## Environment Setup

### For Each Service

Create `.env` file in service root:

**user-service/.env**
```
PORT=5002
NODE_ENV=development
DB_HOST=localhost
DB_PORT=27017
DB_NAME=bajaj_mis
DB_USER=admin
DB_PASSWORD=your_password
SKIP_DB_CONNECT=false
```

**auth-service/.env**
```
PORT=5003
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
DB_HOST=localhost
DB_PORT=27017
DB_NAME=bajaj_mis
DB_USER=admin
DB_PASSWORD=your_password
```

...and so on for each service.

### Database Configuration

MongoDB setup required:
```bash
# Local MongoDB
mongod --dbpath /path/to/data

# Or use Docker
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
  mongo:latest
```

---

## Common Commands

```bash
# From backend root directory

# Install all dependencies
npm install

# Start all services
npm start

# Clean install
rm -rf node_modules package-lock.json && npm install

# Check workspace status
npm ls -a

# List installed packages
npm ls

# Update packages
npm update

# Check for security issues
npm audit

# Fix security issues
npm audit fix
```

---

## What Gets Installed?

### Shared Package (@bajaj/shared)
Provides to all services:
- ✅ Express middleware
- ✅ Database connections
- ✅ HTTP utilities
- ✅ Response helpers
- ✅ Authentication
- ✅ Configuration management
- ✅ Logging utilities

### Each Service Gets
- ✅ Dependencies from root (express, cors, dotenv, etc.)
- ✅ Access to @bajaj/shared
- ✅ Service-specific packages

### Example Dependencies
```
express              - Web framework
cors                 - CORS middleware
dotenv               - Environment variables
mongoose             - MongoDB ODM
bcryptjs             - Password hashing
jsonwebtoken         - JWT tokens
redis                - Caching
mssql                - SQL Server driver
```

---

## Monorepo Best Practices

### ✅ DO
- Install from root: `npm install` (not from service folder)
- Use workspace package specifier: `"@bajaj/shared": "workspace:*"`
- Commit package-lock.json at root
- Update shared package when needed by all services
- Test all services after shared package changes

### ❌ DON'T
- Install from service folder: `cd services/user-service && npm install`
- Mix npm/yarn/pnpm in same monorepo
- Delete node_modules/@bajaj/shared manually
- Use different versions for shared package
- Ignore package-lock.json changes

---

## Development Workflow

### When Starting Development
```bash
# 1. One time setup
cd backend
npm install

# 2. Start services
npm start

# 3. Or start specific service in development
cd services/user-service
npm run dev
```

### When Modifying Shared Package
```bash
# 1. Make changes in shared/
# 2. Run from backend root
npm install

# 3. Restart services
# npm will auto-link changes
```

### When Adding New Dependencies

**For a specific service:**
```bash
cd services/user-service
npm install new-package

# This updates services/user-service/package.json
```

**For shared package:**
```bash
cd shared
npm install new-package

# Then reinstall from root
cd ../
npm install
```

**For root:**
```bash
npm install new-package  # From root
```

---

## Continuous Integration

### For CI/CD Pipelines
```bash
# In your CI configuration (GitHub Actions, Jenkins, etc.)

# Install dependencies
npm install

# Run tests (if configured)
npm test

# Build (if needed)
npm run build

# Start services
npm start
```

---

## Deployment Checklist

Before deploying:

- [ ] Run `npm install` to get latest dependencies
- [ ] Run `npm audit` to check for vulnerabilities
- [ ] Fix security issues: `npm audit fix`
- [ ] Test all services start: `npm start`
- [ ] Check health endpoints: `curl http://localhost:5002/api/health`
- [ ] Verify database connections
- [ ] Set production environment variables
- [ ] Update package-lock.json in version control

---

## Support

### Getting Help

1. Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
2. Check [SERVICE_STANDARDS.md](./SERVICE_STANDARDS.md)
3. Check [QUICK_REFERENCE_GUIDE.md](./QUICK_REFERENCE_GUIDE.md)

### Common Issues

| Issue | Solution |
|-------|----------|
| @bajaj/shared not found | Run `npm install` from root |
| Port already in use | Kill process: `kill -9 $(lsof -t -i:5002)` |
| Database connection fails | Check MongoDB is running |
| Services won't start | Check .env files are configured |
| node_modules corrupted | Delete and reinstall: `rm -rf node_modules && npm install` |

---

## Next Steps

1. ✅ Run `npm install` (or setup.bat)
2. ✅ Verify @bajaj/shared is linked
3. ✅ Create .env files for each service
4. ✅ Start services: `npm start`
5. ✅ Test health checks
6. ✅ Begin development!

---

**Last Updated**: March 2026  
**Version**: 1.0

