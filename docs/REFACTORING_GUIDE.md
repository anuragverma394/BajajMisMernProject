# Service Refactoring Guide - Use Shared Utilities

## Overview

All microservices now have centralized, shared utilities to eliminate code duplication. This guide shows how to update each service to use these shared modules while keeping your production logic intact.

## Files Created in `/backend/shared/`

```
shared/
├── config/
│   ├── constants.js          # Centralized configuration constants
│   └── database.js           # SQL Server connection pooling
├── core/
│   ├── db/
│   │   ├── mssql.js         # Low-level database operations
│   │   └── query-executor.js # Query interface
│   └── http/
│       ├── response.js       # Response builders
│       └── errors.js         # Custom error classes
└── middleware/
    ├── error.middleware.js   # Global error handling
    └── validate.middleware.js # Request validation
```

---

## Migration Steps for Each Service

### Step 1: Update `src/config/sqlserver.js`

**Instead of: Service-specific sqlserver.js**
**Use:** Shared database.js

```javascript
// BEFORE (auth-service/src/config/sqlserver.js)
const sql = require('mssql');
let sqlNative = null;
try {
  sqlNative = require('mssql/msnodesqlv8');
} catch (error) {
  sqlNative = null;
}
function getConnectionStringBySeason(seasonValue) {
  // ... duplicate code
}

// AFTER (updated import)
// Simply import from shared location
const database = require('../../../shared/config/database');
// Or in your imports:
const { getPool, sql } = require('../../../shared/config/database');
```

**Action Items:**
- [ ] Replace content of `src/config/sqlserver.js` with shared version
- [ ] Or: Update all imports from `./src/config/sqlserver` to `../../../shared/config/database`
- [ ] Test database connections work correctly

---

### Step 2: Update `src/config/database.js`

**Instead of:** Database.js that just imports from sqlserver.js
**Use:** Reference the shared config

```javascript
// BEFORE (auth-service/src/config/database.js)
const { getPool } = require('./sqlserver');

async function connectDatabase() {
  await getPool(process.env.DEFAULT_SEASON || '2526');
  console.log('Database connection ready');
}

// AFTER (option 1: keep simple wrapper)
const { getPool } = require('../../../shared/config/database');

async function connectDatabase() {
  await getPool(process.env.DEFAULT_SEASON || '2526');
  console.log(`[${process.env.SERVICE_NAME}] Database connection ready`);
}

// OR (option 2: import directly in server.js)
// const { getPool } = require('./shared/config/database');
// await getPool(...);
```

---

### Step 3: Update Middleware - Error Handler

**Before:**
```javascript
// Each service: src/middleware/error.middleware.js (duplicate code)
```

**After:**
```javascript
// BEFORE: Each service has their own copy

// AFTER: Use shared version in app.js

// app.js
const { notFoundHandler, errorHandler } = require('../shared/middleware/error.middleware');

app.use(errorHandler);
```

**Action Items:**
- [ ] In app.js, import from shared location
- [ ] Delete local error.middleware.js file (or keep it as redirect for compatibility)
- [ ] Test error responses work the same way

---

### Step 4: Update HTTP Response Helpers

**Before:**
```javascript
// Each service: src/core/http/response.js (duplicate code)
```

**After:**
```javascript
// app.js
const { attachResponseHelpers } = require('../shared/core/http/response');

app.use(attachResponseHelpers);

// Now use in controllers:
res.apiSuccess('User created', userData, 201);
res.apiError('User not found', 'NOT_FOUND', 404);
```

---

### Step 5: Use Shared Error Classes

**Before:**
```javascript
// Each service has custom AppError class

class AppError extends Error {
  constructor(message, statusCode = 500) {
    // ... duplicate implementation
  }
}
```

**After:**
```javascript
// Import from shared
const { badRequest, notFound, unauthorized } = require('../shared/core/http/errors');

// Use in code:
if (!user) {
  throw notFound('User not found');
}

if (!token) {
  throw unauthorized('Authentication required');
}

if (invalid) {
  throw badRequest('Invalid input format');
}
```

---

### Step 6: Use Centralized Constants

**Before:**
```javascript
// Hardcoded values scattered throughout

const timeout = 300000; // 5 minutes
const bcryptRounds = 10;
const jwtExpiry = '24h';
```

**After:**
```javascript
// Import once
const CONFIG = require('../shared/config/constants');

// Use anywhere
const timeout = CONFIG.DATABASE.REQUEST_TIMEOUT_MS;  // 300000
const rounds = CONFIG.SECURITY.BCRYPT_ROUNDS;        // 10
const expiry = CONFIG.SECURITY.JWT_EXPIRY_DEFAULT;   // '24h'
const errorCode = CONFIG.ERROR_CODES.NOT_FOUND;      // 'NOT_FOUND'
```

---

## Migration Checklist Template

For each service, follow this checklist:

### Service: `(name)` ✅

- [ ] **Database Configuration**
  - [ ] Updated `src/config/sqlserver.js` to use shared version
  - [ ] Updated `src/config/database.js` import path
  - [ ] Tested database connections

- [ ] **Middleware**
  - [ ] Updated error middleware import in `app.js`
  - [ ] Updated validate middleware import
  - [ ] Deleted or archived local middleware files

- [ ] **HTTP Responses**
  - [ ] Added `attachResponseHelpers` middleware to `app.js`
  - [ ] Updated controllers to use `res.apiSuccess()` and `res.apiError()`
  - [ ] Deleted or archived `src/core/http/response.js`

- [ ] **Error Handling**
  - [ ] Updated controllers to import from shared errors
  - [ ] Replaced custom AppError with shared classes
  - [ ] Deleted or archived `src/core/http/errors.js`

- [ ] **Configuration**
  - [ ] Removed hardcoded constants
  - [ ] Importing CONFIG from shared
  - [ ] All hardcoded values replaced with CONFIG references

- [ ] **Testing**
  - [ ] Service starts without errors
  - [ ] Database connections work
  - [ ] API responses have correct format
  - [ ] Error responses work as expected
  - [ ] No duplicate code warnings

---

## Example: Migrate auth-service

### Current Structure
```
auth-service/
├── src/
│   ├── config/
│   │   ├── database.js        (wrapper)
│   │   └── sqlserver.js       (DUPLICATE)
│   ├── middleware/
│   │   └── error.middleware.js (DUPLICATE)
│   ├── core/
│   │   └── http/
│   │       ├── response.js     (DUPLICATE)
│   │       └── errors.js       (DUPLICATE)
│   └── ...rest of code
└── app.js
```

### After Migration
```
auth-service/
├── src/
│   ├── config/
│   │   └── database.js        (thin wrapper, uses shared)
│   ├── middleware/
│   │   └── (error.middleware.js - DELETED)
│   ├── core/
│   │   └── http/
│   │       └── (response.js - DELETED)
│   │       └── (errors.js - DELETED)
│   └── ...rest of code (NO CHANGES)
└── app.js (updated imports)
```

### File Changes

**1. src/config/sqlserver.js → DELETE or make a stub**
```javascript
// If keeping for compatibility:
module.exports = require('../../../shared/config/database');
```

**2. src/config/database.js → Keep but simplify**
```javascript
// Just keep the connection setup
const { getPool } = require('../../../shared/config/database');

async function connectDatabase() {
  await getPool(process.env.DEFAULT_SEASON || '2526');
  console.log('[AUTH] Database connection ready');
}

module.exports = connectDatabase;
```

**3. app.js → Update imports**
```javascript
// OLD
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { attachResponseHelpers } = require('./core/http/response');

// NEW
const { notFoundHandler, errorHandler } = require('../shared/middleware/error.middleware');
const { attachResponseHelpers } = require('../shared/core/http/response');

// ... rest stays the same
```

**4. Controllers → Use shared errors**
```javascript
// OLD
const AppError = require('../core/http/errors');
throw new AppError('Invalid', 400, 'BAD_REQUEST');

// NEW
const { badRequest } = require('../shared/core/http/errors');
throw badRequest('Invalid input');
```

---

## Quick Migration Script

```bash
# From project root

# 1. Copy shared utilities (already done)
# No action needed - files are in shared/

# 2. For each service:
services=("auth-service" "user-service" "dashboard-service" "report-service" "lab-service" "tracking-service" "survey-service" "distillery-service" "whatsapp-service")

for service in "${services[@]}"; do
  echo "=== Migrating $service ==="
  
  # Backup original files
  # mkdir -p backup/$service
  # cp -r backend/services/$service/src/config backup/$service/ 2>/dev/null || true
  # cp -r backend/services/$service/src/middleware backup/$service/ 2>/dev/null || true
  # cp -r backend/services/$service/src/core backup/$service/ 2>/dev/null || true
  
  # Remove duplicate files (after verifying they match shared versions)
  # rm -f backend/services/$service/src/config/sqlserver.js
  # rm -f backend/services/$service/src/middleware/error.middleware.js
  # rm -f backend/services/$service/src/core/http/response.js
  # rm -f backend/services/$service/src/core/http/errors.js
  
  echo "✓ $service ready for manual review"
done
```

---

## Verification Commands

```bash
# 1. Check for duplicate files
grep -r "function getConnectionStringBySeason" backend/services/*/src/config/

# 2. Test service starts
cd backend/services/auth-service
npm install
npm run dev

# 3. Test health endpoint
curl http://localhost:5001/api/health

# 4. Test error response format
curl http://localhost:5001/invalid

# 5. Check no hardcoded values remain
grep -r "300000\|86400" backend/services/auth-service/src/ | grep -v node_modules | grep -v ".md"
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '../shared/config/database'"

**Solution:** Ensure relative paths are correct
```javascript
// From: backend/services/auth-service/src/config/database.js
// To: backend/shared/config/database.js
// Path should be: ../../../shared/config/database
```

### Issue: DATABASE_CONFIG is undefined

**Solution:** Make sure .env variables are set
```bash
export DB_SERVER=localhost
export DB_NAME=BajajMis
export DB_USER=sa
export DB_PASSWORD=yourpassword
export DEFAULT_SEASON=2526
```

### Issue: Circular dependency error

**Solution:** Ensure no circular imports
- Don't import app.js level code in middleware
- Keep middleware pure functions
- Import middleware in app.js, not vice versa

---

## Progress Tracking

- [ ] Create shared utilities ✓
- [ ] Migrate auth-service
- [ ] Migrate user-service
- [ ] Migrate dashboard-service
- [ ] Migrate report-service
- [ ] Migrate lab-service
- [ ] Migrate tracking-service
- [ ] Migrate survey-service
- [ ] Migrate distillery-service
- [ ] Migrate whatsapp-service
- [ ] Test all services
- [ ] Clean up and verify

