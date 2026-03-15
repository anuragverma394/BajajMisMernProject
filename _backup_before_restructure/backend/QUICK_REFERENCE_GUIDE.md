# Microservices Standardization - Quick Reference Guide

**For**: Developers creating or modifying microservices  
**Updated**: January 2026  

---

## 🚀 Quick Start Checklist for New Services

```bash
# 1. Create service directory structure
src/
├── config/          # database.js, constants.js
├── middleware/      # error.middleware.js
├── routes/          # [feature].routes.js
├── controllers/     # [feature].controller.js
├── services/        # [feature].service.js
├── models/          # [feature].model.js
├── core/
│   ├── http/        # response.js
│   └── utils/       # utilities
└── validators/      # [feature].validator.js

# 2. Copy template files from existing service
# 3. Update service name references
# 4. Test health check
# 5. Test graceful shutdown
```

---

## 📋 app.js Template

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { attachResponseHelpers } = require('./src/core/http/response');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');

dotenv.config();
const app = express();

// 1️⃣ Security headers (FIRST)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2️⃣ CORS
app.use(cors({ origin: '*' }));

// 3️⃣ Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Response helpers
app.use(attachResponseHelpers);

// 5️⃣ Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: '[service-name]-service healthy', 
    data: { service: '[service-name]-service' } 
  });
});

// 6️⃣ Routes
app.use('/api/[route]', require('./src/routes/[route].routes'));

// 7️⃣ Error handlers (LAST)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
```

---

## 🖥️ server.js Template

```javascript
require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT || 5000);
let server;

async function bootstrap() {
  try {
    if (String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() !== 'true') {
      await connectDatabase();
    }
    server = app.listen(port, () => {
      console.log(`[service]-service listening on port ${port}`);
    });
  } catch (error) {
    console.error('[service]-service failed to start', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  if (server) {
    server.close(() => {
      console.log('[service]-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  if (server) {
    server.close(() => {
      console.log('[service]-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

bootstrap();
```

---

## 🛣️ Routes Template

```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/[feature].controller');
const { validate } = require('../validators/[feature].validator');

router.get('/', controller.getAll);
router.post('/', validate, controller.create);
router.get('/:id', controller.getById);
router.put('/:id', validate, controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
```

---

## 🎮 Controller Template

```javascript
const Service = require('../services/[feature].service');

class Controller {
  async getAll(req, res) {
    try {
      const items = await Service.getAll();
      res.sendSuccess(items, 'Items fetched successfully');
    } catch (error) {
      res.sendError(error.message, 500, error);
    }
  }

  async create(req, res) {
    try {
      const item = await Service.create(req.body);
      res.sendSuccess(item, 'Item created successfully', 201);
    } catch (error) {
      res.sendError(error.message, 500, error);
    }
  }

  async getById(req, res) {
    try {
      const item = await Service.getById(req.params.id);
      if (!item) {
        res.sendError('Item not found', 404);
        return;
      }
      res.sendSuccess(item);
    } catch (error) {
      res.sendError(error.message, 500, error);
    }
  }
}

module.exports = new Controller();
```

---

## 💼 Service Template

```javascript
const Model = require('../models/[feature].model');

class Service {
  async getAll(filters = {}) {
    try {
      return await Model.find(filters);
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const item = new Model(data);
      return await item.save();
    } catch (error) {
      throw new Error(`Failed to create: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      return await Model.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await Model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw new Error(`Failed to update: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  }
}

module.exports = new Service();
```

---

## ✅ Validator Template

```javascript
const validate = (req, res, next) => {
  const { field1, field2 } = req.body;

  if (!field1) {
    res.sendError('Field1 is required', 400);
    return;
  }

  if (!field2) {
    res.sendError('Field2 is required', 400);
    return;
  }

  next();
};

module.exports = { validate };
```

---

## 🗄️ Database Connection

```javascript
// src/config/database.js
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectDatabase;
```

---

## 💬 Response Patterns

### Success Response
```javascript
res.sendSuccess(data, message, statusCode);

// Examples:
res.sendSuccess({ id: 123 }, 'User created', 201);
res.sendSuccess(user);  // Default 200, default message
```

### Error Response
```javascript
res.sendError(message, statusCode, error);

// Examples:
res.sendError('User not found', 404);
res.sendError('Invalid input', 400);
```

### Response Format
```json
{
  "success": true,
  "message": "Description",
  "data": { /* payload */ }
}
```

---

## 🌍 Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=27017
DB_NAME=bajaj_mis
DB_USER=admin
DB_PASSWORD=secure_pass
SKIP_DB_CONNECT=false
```

---

## 🔒 Security Headers (Auto-Applied)

```javascript
// Already in app.js for all services
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## 🏥 Health Check

```bash
# Test health check
curl http://localhost:5000/api/health

# Response
{
  "success": true,
  "message": "[service]-service healthy",
  "data": { "service": "[service]-service" }
}
```

---

## 🛑 Graceful Shutdown

```bash
# Sends SIGTERM (normal shutdown)
kill <pid>

# Or Ctrl+C sends SIGINT
Ctrl+C

# Both will:
# 1. Close incoming connections
# 2. Complete in-flight requests
# 3. Clean shutdown
# 4. Exit with code 0
```

---

## 📊 Common HTTP Status Codes

| Code | When to Use | Example |
|------|-------------|---------|
| **200** | Successful GET, PUT, DELETE | GET user successful |
| **201** | Successful POST (resource created) | User created |
| **204** | Successful DELETE (no body) | Resource deleted |
| **400** | Bad/invalid request | Missing required fields |
| **401** | Missing authentication | No token provided |
| **403** | Insufficient permissions | User lacks access |
| **404** | Resource not found | User ID doesn't exist |
| **409** | Conflict/duplicate | Email already exists |
| **500** | Server error | Unexpected error |

---

## 🧪 Testing Patterns

### Unit Test
```javascript
describe('Service', () => {
  it('should fetch item', async () => {
    const result = await Service.getById('123');
    expect(result).toBeDefined();
  });
});
```

### Integration Test
```javascript
describe('API', () => {
  it('should return 200 for GET', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🎯 Service Communication

```javascript
// Call another service
const axios = require('axios');

const response = await axios.get(
  'http://other-service:5000/api/endpoint',
  { timeout: 5000 }
);

const data = response.data;
```

---

## 📝 Logging Examples

```javascript
// Success
console.log('Operation completed', { userId: 123, action: 'create' });

// Error
console.error('Operation failed', { error: err.message, stack: err.stack });

// Info
console.log('Service started', { port: 5000, env: 'development' });
```

---

## 🚀 Service Ports Reference

```
user-service    → 5002
lab-service     → 5005
survey-service  → 5006
tracking-service→ 5007
distillery      → 5008
whatsapp        → 5009
```

---

## ⚡ Performance Checklist

- [ ] Database indexes added for frequently queried fields
- [ ] Connection pooling configured
- [ ] Request timeout appropriate
- [ ] Response payload optimized
- [ ] Pagination implemented for lists
- [ ] Caching considered
- [ ] Query efficiency verified

---

## 🔐 Security Checklist

- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (use parameterized queries)
- [ ] Password hashing implemented
- [ ] Sensitive data not logged
- [ ] CORS properly configured
- [ ] Rate limiting considered
- [ ] Error messages don't leak info

---

## 📚 Key Rules to Remember

✅ **DO:**
- Use `res.sendSuccess()` and `res.sendError()`
- Put security headers FIRST in app.js
- Put error handlers LAST in app.js
- Use try-catch in controllers and services
- Store server instance for graceful shutdown
- Use async/await for promises
- Validate all inputs
- Log important operations
- Use descriptive commit messages

❌ **DON'T:**
- Mix error handling patterns
- Put routes before middleware
- Forget to export app in app.js
- Handle SIGTERM but not SIGINT
- Trust user input
- Commit .env files
- Hardcode sensitive data
- Use `var` (use `const` or `let`)
- Ignore database errors
- Skip validation

---

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `SERVICE_STANDARDS.md` | Full documentation |
| `STANDARDIZATION_COMPLETION_REPORT.md` | What was changed |
| `app.js` | Express configuration |
| `server.js` | Startup and shutdown |
| `.env` | Environment variables |
| `package.json` | Dependencies |

---

## 🆘 Troubleshooting

### Service won't start
```bash
# 1. Check port is available
netstat -an | grep 5000

# 2. Verify environment variables
echo $DB_HOST
echo $PORT

# 3. Check database connection
# Set SKIP_DB_CONNECT=true temporarily
```

### Health check failing
```bash
# 1. Check service is running
ps aux | grep node

# 2. Test endpoint
curl http://localhost:5000/api/health

# 3. Check logs
docker logs [service-name]
```

### Graceful shutdown not working
```bash
# 1. Verify signal handlers present (check server.js)
# 2. Test manually
kill -SIGTERM <pid>

# 3. Increase timeout if needed
server.close(() => { ... }, 10000);
```

---

## 📖 Where to Find Info

- **Complete Patterns**: `/backend/SERVICE_STANDARDS.md`
- **Changes Made**: `/backend/STANDARDIZATION_COMPLETION_REPORT.md`
- **Examples**: Look at existing services
- **Questions**: Refer to templates above or existing code

---

## ✨ TL;DR

1. Copy existing service as template
2. Update service name in `app.js` and `server.js`
3. Implement routes, controllers, services
4. Use `res.sendSuccess()` and `res.sendError()`
5. Add error handlers
6. Test health check: `curl /api/health`
7. Test shutdown: `kill <pid>`
8. Deploy!

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Keep this guide handy!** 📌

