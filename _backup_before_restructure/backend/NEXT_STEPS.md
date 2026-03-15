# Next Steps - Service Migration Ready

## 🎯 Immediate Actions (This Week)

### 1. **Review the Shared Module** (30 minutes)
```bash
# Location: backend/shared/
# Read these files in this order:

1. shared/README.md              # Overview & examples
2. shared/MIGRATION_GUIDE.md     # Step-by-step integration
3. shared/lib/http/response.js   # Response format
4. shared/lib/http/errors.js     # Error handling
5. shared/lib/middleware/auth.middleware.js  # Authentication
```

### 2. **Understand the Module Structure** (15 minutes)
```
shared/
├── lib/
│   ├── http/           # Response & error formatting
│   ├── middleware/     # Auth, validation, error handling
│   ├── db/            # Database pooling & queries
│   ├── utils/         # Logger, cache, helpers
│   └── config/        # Centralized configuration
├── package.json       # Workspace package definition
├── index.js           # Main entry point
├── README.md          # Documentation
└── MIGRATION_GUIDE.md # Integration guide
```

### 3. **Verify Setup** (5 minutes)
```bash
cd backend
npm install               # Install dependencies
npm --workspace=shared ls # List shared module files
```

---

## 🚀 Service Migration (Pick One Per Day)

### Recommended Order
1. **user-service** (simplest, 2 hours)
2. **auth-service** (2.5 hours)
3. **dashboard-service** (3 hours)
4. **report-service** (4 hours + consolidation)
5. **tracking-service** (2 hours)
6. **survey-service** (2 hours)
7. **whatsapp-service** (2 hours)
8. **lab-service** (2 hours)
9. **distillery-service** (2 hours)
10. **payment-service** (2 hours)

### For Each Service Migration (Follow MIGRATION_GUIDE.md)

**Phase 1: Update package.json**
```json
{
  "dependencies": {
    "@bajaj/shared": "workspace:*",
    "express": "^4.18.2",
    // Keep service-specific dependencies only
    // Remove duplicates (bcryptjs, jwt, mssql, etc.)
  }
}
```

**Phase 2: Update app.js (or server.js)**
```javascript
const { initialize, shutdown, setupErrorHandler } = require('@bajaj/shared');

app.use(require('@bajaj/shared').attachResponseHelpers);
// ... rest of middleware

app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});

process.on('SIGTERM', shutdown);
```

**Phase 3: Update Middleware**
```javascript
// OLD: const authMiddleware = require('./middleware/auth');
// NEW:
const { requireAuth } = require('@bajaj/shared');
app.use(requireAuth);
```

**Phase 4: Update Controllers**
```javascript
// OLD: const { sendSuccess, sendError } = require('../core/response');
// NEW:
const { attachResponseHelpers } = require('@bajaj/shared');
// Then use: res.apiSuccess('message', data)
```

**Phase 5: Test Locally**
```bash
cd services/user-service
npm install
npm start
# Verify:
# - Service starts without errors
# - HTTP endpoints respond
# - Database queries work
# - Errors are handled
```

---

## ✅ Testing Checklist

### For Each Service
- [ ] Starts without errors
- [ ] Environment variables loaded
- [ ] Database connection successful
- [ ] GET endpoint returns data in new format
- [ ] GET endpoint returns error in new format
- [ ] Error handler catches exceptions
- [ ] Request ID appears in responses
- [ ] Cache works (if using getOrSet)
- [ ] Logs appear in console

### Full Integration Test
```bash
# Test all services together
1. Start auth-service
2. Start user-service
3. Start dashboard-service
4. Test user login → creates session → dashboard loads
5. Verify response format consistent
6. Verify error format consistent
7. Verify request IDs in logs
```

---

## 📊 Metrics to Track

### Performance
```
Metric                  Target          How to Measure
---------------------------------------------------
Service startup time    < 3s            time service-name start
Node process memory     < 200MB         ps aux | grep node
Response time           < 500ms         curl -w timing
Database query time     < 100ms         Check logger.debug output
Cache hit rate          70-80%          Monitor cache.js debug logs
```

### Code Quality
```
Metric                  Target          How to Measure
---------------------------------------------------
Duplicate code          < 5%            Compare services
Code coverage          > 80%            npm test -- --coverage
Lint errors            0                npm run lint
Type errors            0                npm run type-check
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "MODULE_NOT_FOUND: @bajaj/shared"
```bash
# Fix: Install dependencies
npm install
npm install --workspace=shared
```

### Issue 2: "Cannot find module auth"
```javascript
// OLD: const auth = require('./middleware/auth');
// NEW:
const { requireAuth } = require('@bajaj/shared');
```

### Issue 3: Config values undefined
```javascript
// Ensure env vars are set:
export SERVICE_NAME=user-service
export SERVICE_PORT=3001
export DB_SERVER=your-server
export JWT_SECRET=your-secret
export REDIS_URL=redis://localhost:6379
```

### Issue 4: Response format mismatch
```javascript
// OLD: res.json({data: user})
// NEW:
res.apiSuccess('User retrieved', user)
// Returns: {success: true, message: 'User retrieved', data: user, timestamp, requestId}
```

### Issue 5: Redis not connecting
```javascript
// Check:
1. Redis server is running
2. REDIS_URL env var is correct
3. Check logs with getLogger('service').debug()
4. Falls back to no caching if Redis unavailable
```

---

## 📈 Expected Timeline

```
Day 1:  Review documentation & setup (2 hours)
        Migrate user-service (2 hours)

Day 2:  Migrate auth-service (2.5 hours)
        Integration testing (2 hours)

Day 3:  Migrate dashboard-service (3 hours)
        Test against real scenarios (2 hours)

Day 4:  Migrate report-service (4 hours)
        Test report endpoints (2 hours)

Day 5:  Migrate remaining services (8 hours total)
        Final integration test

Days 6-7: Performance testing, monitoring setup
          Production deployment planning
```

---

## 🎁 Deliverables Status

### ✅ Completed
- [x] Shared module created (17 files)
- [x] HTTP layer unified
- [x] Middleware consolidated
- [x] Database pooling implemented
- [x] Logging configured
- [x] Caching layer ready
- [x] Configuration centralized
- [x] Documentation written
- [x] Migration guide prepared

### 📋 Next (Service Migration)
- [ ] user-service integration
- [ ] auth-service integration
- [ ] dashboard-service integration
- [ ] report-service integration
- [ ] remaining services

### 🚀 Finally (Testing & Deployment)
- [ ] End-to-end test
- [ ] Performance validation
- [ ] Staging deployment
- [ ] Production rollout

---

## 📞 Quick Reference

**Location of Shared Module:**
```
backend/shared/
```

**Main Export:**
```javascript
const { 
  initialize,        // Call on app startup
  shutdown,          // Call on app shutdown
  getLogger,         // Get structured logger
  attachResponseHelpers,      // Middleware: attach res.apiSuccess()
  setupErrorHandler,          // Middleware: global error handler
  requireAuth,       // Middleware: JWT verification
  optionalAuth,      // Middleware: optional JWT
  validate,          // Middleware: Zod validation
  catchAsync,        // Wrapper: async error handling
  NotFoundError,     // Error class
  BadRequestError,   // Error class
  UnauthorizedError, // Error class
  getConnectionPool, // Get DB connection pool
  cache,             // Redis cache instance
  config             // Configuration object
} = require('@bajaj/shared');
```

**Configuration:**
```bash
# Set these env vars (or use defaults)
SERVICE_NAME=your-service
SERVICE_PORT=3001
NODE_ENV=development
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your-password
JWT_SECRET=your-secret
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

---

## ✨ Success Criteria

By end of this week:
- [ ] All team members understand shared module
- [ ] User-service migrated & tested
- [ ] Auth-service migrated & tested
- [ ] At least 3 services using shared module
- [ ] No regressions in functionality
- [ ] Response formats consistent
- [ ] Logs showing proper tracing
- [ ] Performance metrics tracking

---

## 💡 Tips for Success

1. **Start small** - Migrate simplest service first
2. **Test thoroughly** - Don't skip testing steps
3. **Use migration guide** - Follow Phase 1-10 exactly
4. **Ask for help** - Review code comments if confused
5. **Track time** - Note actual vs estimated time per service
6. **Monitor closely** - Watch logs during first hours
7. **Rollback ready** - Keep old files until fully confident
8. **Celebrate progress** - Each service completed is a win!

---

## 🎯 End Goal

**Before:** 10 independent services, 5,000+ duplicated lines, inconsistent patterns  
**After:** Unified microservices architecture, 0% duplication, standardized patterns  
**Result:** Easier maintenance, faster development, better reliability

---

**Start with:** `backend/shared/MIGRATION_GUIDE.md` → Pick first service → Begin migration!
