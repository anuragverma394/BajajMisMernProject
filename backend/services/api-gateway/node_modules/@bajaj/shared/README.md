# @bajaj/shared - Unified Microservices Library

Centralized utilities and middleware for all Bajaj microservices. Eliminates code duplication and ensures consistency across services.

## 📦 Contents

### HTTP Utilities (`lib/http/`)
- **response.js** - Unified response formatting with request tracing
- **errors.js** - Standard error classes and error middleware

### Middleware (`lib/middleware/`)
- **auth.middleware.js** - JWT + Gateway header authentication
- **error.middleware.js** - Async error wrapping and global error handler
- **validate.middleware.js** - Zod-based request validation with common schemas

### Database (`lib/db/`)
- **mssql.js** - Connection pooling and lifecycle management
- **query-executor.js** - Query, scalar, and procedure execution wrapper

### Utilities (`lib/utils/`)
- **logger.js** - Structured logging with levels (DEBUG, INFO, WARN, ERROR)
- **cache.js** - Redis-based distributed caching with TTL support

### Configuration (`lib/config/`)
- **index.js** - Centralized environment and service configuration

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Service Initialization

```javascript
// server.js
const express = require('express');
const {
  initialize,
  shutdown,
  getLogger,
  attachResponseHelpers,
  setupErrorHandler,
  requireAuth,
  config
} = require('@bajaj/shared');

const app = express();
const logger = getLogger('my-service');

// Middleware
app.use(express.json());
app.use(attachResponseHelpers);
app.use(requireAuth);

// Routes
app.get('/api/users', async (req, res) => {
  res.apiSuccess('Users fetched', []);
});

// Error handling
setupErrorHandler(app);

// Start
async function start() {
  await initialize('my-service');
  app.listen(config.SERVICE_PORT, () => {
    logger.info('Server started', { port: config.SERVICE_PORT });
  });
}

start().catch(err => {
  logger.error('Startup failed', err);
  process.exit(1);
});
```

---

## 📚 Usage Guide

### Response Handling

```javascript
const { catchAsync, res } = require('@bajaj/shared');

// Success responses
router.get('/users', catchAsync(async (req, res) => {
  const users = await userService.getAll();
  res.apiSuccess('Users fetched', users, 200);
}));

// Paginated responses
router.get('/users/paginated', catchAsync(async (req, res) => {
  const result = await userService.getPaginated(req.query.page, req.query.pageSize);
  res.apiPaginated('Users fetched', result.data, result.total, result.page, result.pageSize);
}));

// Error responses
router.get('/users/:id', catchAsync(async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.apiSuccess('User fetched', user);
}));
```

### Error Handling

```javascript
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  catchAsync
} = require('@bajaj/shared');

router.post('/users', catchAsync(async (req, res) => {
  // These errors are automatically caught and formatted
  if (!req.body.email) {
    throw new BadRequestError('Email is required');
  }

  const existing = await userService.findByEmail(req.body.email);
  if (existing) {
    throw new ConflictError('Email already exists');
  }

  const user = await userService.create(req.body);
  res.apiSuccess('User created', user, 201);
}));
```

### Authentication

```javascript
const { requireAuth, optionalAuth, verifyToken, signAuthToken } = require('@bajaj/shared');

// Required authentication
router.get('/profile', requireAuth, async (req, res) => {
  console.log(req.user); // { id, userId, name, utid, factId, season, source }
  res.apiSuccess('Profile', req.user);
});

// Optional authentication
router.get('/public', optionalAuth, async (req, res) => {
  if (req.user) {
    // User is authenticated
  }
  res.apiSuccess('Public data', {});
});

// Create JWT token
const token = signAuthToken({
  id: 1,
  userId: 'user123',
  name: 'John Doe'
});

// Verify JWT token
try {
  const decoded = verifyToken(token);
  console.log(decoded);
} catch (err) {
  console.log('Invalid token');
}
```

### Validation

```javascript
const { validate, commonSchemas, z } = require('@bajaj/shared');

// Use common schemas
router.get('/list', validate(commonSchemas.pagination, { source: 'query' }), async (req, res) => {
  // req.query automatically has: page, pageSize, skip
  const results = await service.list(req.query.skip, req.query.pageSize);
  res.apiPaginated('Results', results.data, results.total);
});

// Custom validation
const userSchema = z.object({
  id: z.coerce.number().positive(),
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: commonSchemas.phoneNumber,
  season: z.string().optional().default('2526')
});

router.post('/users', validate(userSchema), async (req, res) => {
  // req.body is validated and sanitized
  const user = await userService.create(req.body);
  res.apiSuccess('User created', user, 201);
});
```

### Database Operations

```javascript
const { getConnectionPool, createQueryExecutor } = require('@bajaj/shared/db');

// Initialize connection pool
const pool = await getConnectionPool({
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER
});

const queryExecutor = createQueryExecutor(pool);

// Execute query
async function getUser(id) {
  const users = await queryExecutor.executeQuery(
    'SELECT * FROM tm_user WHERE id = @id',
    { id }
  );
  return users[0] || null;
}

// Execute scalar
async function getUserCount() {
  return queryExecutor.executeScalar(
    'SELECT COUNT(*) FROM tm_user'
  );
}

// Execute stored procedure
async function getReport(factoryId, season) {
  return queryExecutor.executeProcedure(
    'sp_GetCrushingReport',
    { factoryId, season }
  );
}

// Execute with pagination
async function listUsers(page = 1, pageSize = 10) {
  return queryExecutor.executeQueryPaginated(
    'SELECT id, name, email FROM tm_user',
    {},
    page,
    pageSize
  );
}

// Execute transaction
async function transferUser(fromFactory, toFactory, userId) {
  return queryExecutor.executeTransaction(async (transaction) => {
    // All operations in this callback use transaction connection
    await transaction.procedure('sp_RemoveUserFromFactory', { factoryId: fromFactory, userId });
    await transaction.procedure('sp_AddUserToFactory', { factoryId: toFactory, userId });
  });
}
```

### Logging

```javascript
const { getLogger, setLogLevel } = require('@bajaj/shared');

const logger = getLogger('user-service');

// Different log levels
logger.debug('Debugging info', { userId: 123 });
logger.info('User created', { userId: 123, email: 'user@example.com' });
logger.warn('Slow query detected', { queryTime: 2500 });
logger.error('Database error', error, { query: 'SELECT...' });

// Change global log level
setLogLevel('WARN'); // Only WARN and ERROR will be logged
```

### Caching

```javascript
const { cache, cacheKey } = require('@bajaj/shared');

// Get or set pattern
const user = await cache.getOrSet(
  cacheKey('user', userId),
  () => userRepository.getById(userId),
  3600 // 1 hour TTL
);

// Explicit operations
await cache.set('key', { data: 'value' }, 3600);
const value = await cache.get('key');
await cache.del('key');

// Flush all (careful!)
await cache.flush();

// Check if connected
if (cache.isConnected()) {
  console.log('Cache is available');
}
```

### Configuration

```javascript
const { config, getConfig, validateEnv } = require('@bajaj/shared');

// Use config directly
console.log(config.SERVICE_PORT); // 3002
console.log(config.NODE_ENV); // 'development'
console.log(config.REDIS_ENABLED); // true

// Get with overrides
const customConfig = getConfig({ SERVICE_PORT: 8080 });

// Validate specific variables
validateEnv(['DB_SERVER', 'DB_USER', 'DB_PASSWORD']);

// Check environment
if (config.isProduction) {
  // Production-only code
}
```

---

## 🏗️ Architecture

```
@bajaj/shared/
├── index.js                    (Main entry point)
├── package.json
├── lib/
│   ├── http/
│   │   ├── response.js        (Unified response formatting)
│   │   ├── errors.js          (Error classes and handler)
│   │   └── index.js           (Exports)
│   ├── middleware/
│   │   ├── auth.middleware.js (Auth logic)
│   │   ├── error.middleware.js (Error handling)
│   │   ├── validate.middleware.js (Validation)
│   │   └── index.js           (Exports)
│   ├── db/
│   │   ├── mssql.js           (Connection pooling)
│   │   ├── query-executor.js  (Query execution)
│   │   └── index.js           (Exports)
│   ├── utils/
│   │   ├── logger.js          (Logging)
│   │   ├── cache.js           (Caching)
│   │   └── index.js           (Exports)
│   └── config/
│       └── index.js           (Configuration)
└── MIGRATION_GUIDE.md         (How to migrate services)
```

---

## 📋 Response Format

All responses follow unified format:

### Success Response
```json
{
  "success": true,
  "message": "Users fetched",
  "data": [...],
  "timestamp": "2024-03-14T12:30:00.000Z",
  "requestId": "1234567890-abc123"
}
```

### Error Response
```json
{
  "success": false,
  "message": "User not found",
  "errorCode": "NOT_FOUND",
  "timestamp": "2024-03-14T12:30:00.000Z",
  "requestId": "1234567890-abc123"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Users fetched",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasMore": true
  },
  "timestamp": "2024-03-14T12:30:00.000Z",
  "requestId": "1234567890-abc123"
}
```

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Gateway Header Support** - API Gateway can pass user context
- **Request ID Tracking** - All requests have unique IDs for tracing
- **Environment Validation** - Ensures critical env vars are set
- **Bcrypt Integration** - Password hashing utilities
- **Error Sanitization** - Stack traces only in development

---

## 📊 Performance Considerations

- **Connection Pooling** - Efficient database connection reuse (min 2, max 10)
- **Redis Caching** - Distributed caching with configurable TTL
- **Async/Await** - Fully async operations
- **Error Recovery** - Automatic retry with exponential backoff
- **Request Tracing** - Unique request IDs for debugging

---

## ✅ Best Practices

1. **Always use `catchAsync`** for route handlers
2. **Initialize service** with `initialize()` on startup
3. **Validate inputs** with Zod schemas
4. **Use logger** instead of console
5. **Implement graceful shutdown** with `shutdown()`
6. **Cache master data** (users, factories, seasons)
7. **Set environment variables** before running
8. **Use connection pooling** for database
9. **Handle errors** with custom error classes
10. **Test middleware** independently

---

## 📞 Support

For issues or questions:

1. Check MIGRATION_GUIDE.md for integration help
2. Review examples in lib/*/
3. Check environment variables in config/
4. Enable DEBUG logging for troubleshooting

---

## 📄 License

Proprietary - Bajaj Team
