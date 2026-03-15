# Shared Module Implementation Guide

## Overview

The `@bajaj/shared` module consolidates all duplicated microservices utilities into a single source of truth. This guide helps you migrate existing services to use the new shared module.

---

## Phase 1: Installation & Setup

### Step 1: Update Backend Package.json

```bash
cd backend
```

Update `backend/package.json` to use workspaces:

```json
{
  "name": "bajaj-backend",
  "version": "1.0.0",
  "workspaces": [
    "shared",
    "services/*"
  ],
  "dependencies": {
    "redis": "^4.7.1"
  }
}
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install dependencies for root and all workspaces.

---

## Phase 2: Update Individual Services

### For Each Service: Update package.json

**Remove duplicated dependencies**, keep only service-specific ones:

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@bajaj/shared": "workspace:*"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

## Phase 3: Migrate Service Startup

### Update `src/app.js` in your service:

**Before:**
```javascript
const express = require('express');
const cors = require('cors');
const { attachResponseHelpers } = require('./core/http/response');
const { errorHandler } = require('./middleware/error.middleware');
const { requireAuth } = require('./middleware/auth.middleware');

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachResponseHelpers);
```

**After:**
```javascript
const express = require('express');
const cors = require('cors');
const { attachResponseHelpers, setupErrorHandler, requireAuth } = require('@bajaj/shared');

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachResponseHelpers);

// Setup error handler (at the end)
setupErrorHandler(app);
```

---

## Phase 4: Migrate Middleware Usage

### Authentication Middleware

**Before:**
```javascript
router.get('/users', requireAuth, userController.getUsers);
```

**After (identical!):**
```javascript
const { requireAuth } = require('@bajaj/shared');
router.get('/users', requireAuth, userController.getUsers);
```

### Validation Middleware

**Before:**
```javascript
const { validate } = require('../middleware/validate.middleware');
const { z } = require('zod');

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email()
});

router.post('/users', validate(userSchema), userController.createUser);
```

**After:**
```javascript
const { validate, z } = require('@bajaj/shared');

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email()
});

router.post('/users', validate(userSchema), userController.createUser);
```

---

## Phase 5: Migrate Controllers

### Update Response Helpers

**Before:**
```javascript
async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: users
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
}
```

**After (cleaner!):**
```javascript
const { catchAsync } = require('@bajaj/shared');

const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.apiSuccess('Users fetched', users);
});
```

### Error Handling

**Before:**
```javascript
try {
  const user = await userService.getUser(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: user });
} catch (err) {
  res.status(500).json({ success: false, error: err.message });
}
```

**After:**
```javascript
const { NotFoundError, catchAsync } = require('@bajaj/shared');

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.apiSuccess('User fetched', user);
});
```

---

## Phase 6: Migrate Database Services

### Shared Repository Pattern

**Before (`src/repositories/user.repository.js`):**
```javascript
const { query, procedure } = require('../config/sqlserver');

async function getUsers() {
  const result = await procedure('sp_GetUsers', {});
  return result.recordset || [];
}

async function getUserById(id) {
  const result = await query('SELECT * FROM tm_user WHERE id = @id', { id });
  return result.recordset[0] || null;
}

module.exports = { getUsers, getUserById };
```

**After:**
```javascript
const { getConnectionPool } = require('@bajaj/shared/db');

let queryExecutor;

async function initRepository() {
  const pool = await getConnectionPool({
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER
  });
  queryExecutor = pool; // or use createQueryExecutor(pool)
}

async function getUsers() {
  return queryExecutor.procedure('sp_GetUsers');
}

async function getUserById(id) {
  return queryExecutor.query('SELECT * FROM tm_user WHERE id = @id', { id });
}

module.exports = { getUsers, getUserById, initRepository };
```

---

## Phase 7: Migrate Logger Usage

### Update Logging

**Before:**
```javascript
console.log('[INFO] User fetched');
console.error('[ERROR] Failed to fetch user');
```

**After:**
```javascript
const { getLogger } = require('@bajaj/shared');
const logger = getLogger('user-service');

logger.info('User fetched');
logger.error('Failed to fetch user', error);
logger.warn('Missing user data', { userId: 123 });
logger.debug('Query executed', { sql: sqlText });
```

---

## Phase 8: Add Caching (Optional)

### In Your Service

```javascript
const { cache, cacheKey } = require('@bajaj/shared');

async function getUser(id) {
  const key = cacheKey('user', id);
  
  // Try cache first
  const cached = await cache.getOrSet(
    key,
    () => userRepository.getUserById(id),
    3600 // 1 hour TTL
  );
  
  return cached;
}

// Invalidate cache on update
async function updateUser(id, data) {
  const result = await userRepository.updateUser(id, data);
  
  // Clear cache
  await cache.del(cacheKey('user', id));
  
  return result;
}
```

---

## Phase 9: Update Server Startup

### Update `server.js`

**Before:**
```javascript
const app = require('./src/app');
const { getConnectionPool } = require('./src/config/sqlserver');

const PORT = process.env.SERVICE_PORT || 3001;

async function start() {
  try {
    await getConnectionPool();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
}

start();
```

**After:**
```javascript
const app = require('./src/app');
const { initialize, shutdown, getLogger, config } = require('@bajaj/shared');

const logger = getLogger(process.env.SERVICE_NAME || 'service');
const PORT = config.SERVICE_PORT;

async function start() {
  try {
    // Initialize shared services
    await initialize(process.env.SERVICE_NAME || 'service');

    // Start server
    const server = app.listen(PORT, config.SERVICE_HOST, () => {
      logger.info(`Server started`, { 
        port: PORT,
        host: config.SERVICE_HOST,
        environment: config.NODE_ENV
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await shutdown();
        process.exit(0);
      });
    });

  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
```

---

## Phase 10: Environment Variables

### Create `.env` file:

```env
# Service
SERVICE_NAME=user-service
SERVICE_PORT=3002
SERVICE_HOST=0.0.0.0
NODE_ENV=development

# Database
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=BajajMis
DB_USER=sa
DB_PASSWORD=YourPassword
DB_ENCRYPT=true
DB_TRUST_CERTIFICATE=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true

# Authentication
APP_JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=1d
DEFAULT_SEASON=2526

# Logging
LOG_LEVEL=DEBUG

# Service URLs
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
```

---

## Migration Checklist

For each service, follow this checklist:

- [ ] Update package.json dependencies
- [ ] Update app.js to use shared middleware
- [ ] Migrate all require() statements to use @bajaj/shared
- [ ] Update controllers to use res.apiSuccess/apiError
- [ ] Migrate repositories to use getConnectionPool
- [ ] Replace console.log with logger
- [ ] Add cache initialization
- [ ] Update server.js startup sequence
- [ ] Test service locally
- [ ] Test with other services
- [ ] Deploy to staging
- [ ] Monitor logs for errors

---

## Rollback Plan

If issues occur:

1. **Revert package.json** to include all dependencies
2. **Restore src/core/ files** from previous version
3. **Restore original require() paths**
4. **Restart services**

All services remain independent and don't depend on external shared module.

---

## Benefits After Migration

✅ **90% reduction** in duplicated code
✅ **Single source** for middleware, utilities
✅ **Consistent** response/error formats
✅ **Better logging** across services
✅ **Built-in caching** support
✅ **Smaller deployments** (fewer node_modules)
✅ **Easier maintenance** - fix bugs once
✅ **Better testing** - test shared modules once

---

## Support

For issues during migration:

1. Check service logs with `logger.debug()`
2. Verify environment variables in `.env`
3. Test database connection with `getConnectionPool()`
4. Test auth with `requireAuth` middleware
5. Review error format with `res.apiError()`

---

## Next Steps

After completing Phase 1-10 for all services:

1. Consolidate report services (3 versions → 1 versioned)
2. Implement request tracing across services
3. Add metrics collection
4. Setup distributed tracing
5. Implement circuit breaker pattern
