# Microservices Standards & Architecture

## Overview
This document outlines the standardized patterns, configurations, and best practices for all microservices in the Bajaj MERN project backend.

---

## 1. Service Directory Structure

All services follow this standardized directory structure:

```
[service-name]/
├── app.js                    # Express app configuration
├── server.js                 # Server startup and shutdown logic
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── src/
│   ├── config/
│   │   ├── database.js       # Database connection
│   │   └── constants.js      # Service constants
│   ├── middleware/
│   │   ├── error.middleware.js     # Error handling
│   │   └── [others].middleware.js  # Additional middleware
│   ├── routes/
│   │   ├── [feature].routes.js     # Feature routes
│   │   └── ...
│   ├── controllers/
│   │   ├── [feature].controller.js # Business logic
│   │   └── ...
│   ├── models/
│   │   ├── [model].model.js        # Database models
│   │   └── ...
│   ├── services/
│   │   ├── [feature].service.js    # Business services
│   │   └── ...
│   ├── core/
│   │   ├── http/
│   │   │   └── response.js         # Response helpers
│   │   └── utils/
│   │       └── [utilities].js      # Utility functions
│   └── validators/
│       ├── [feature].validator.js  # Input validation
│       └── ...
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## 2. Service Naming & Ports

| Service | Port | Route Prefix |
|---------|------|---|
| user-service | 5002 | `/api/user-management` |
| lab-service | 5005 | `/api/lab` |
| survey-service | 5006 | `/api/survey-*` |
| tracking-service | 5007 | `/api/tracking` |
| distillery-service | 5008 | `/api/distillery` |
| whatsapp-service | 5009 | `/api/whats-app` |

---

## 3. app.js Standardized Pattern

All `app.js` files follow this exact pattern:

### Structure
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { attachResponseHelpers } = require('./src/core/http/response');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');

dotenv.config();

const app = express();

// Security headers middleware (MUST be first after app creation)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
app.use(cors({ origin: '*' }));

// Body parsing middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Response helpers
app.use(attachResponseHelpers);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: '[service-name]-service healthy', 
    data: { service: '[service-name]-service' } 
  });
});

// Route mounting (in order from most specific to least specific)
app.use('/api/[route-prefix]', require('./src/routes/[route].routes'));
// ... additional routes ...

// Error handling middleware (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
```

### Key Points
- ✅ Security headers middleware comes **immediately after** app creation
- ✅ CORS before other middleware
- ✅ Body parsing before route handlers
- ✅ Health check at standard `/api/health` endpoint
- ✅ Routes use consistent naming: `/api/[service-domain]`
- ✅ Error handlers are **last** middleware
- ✅ All services must export the app instance

---

## 4. server.js Standardized Pattern

All `server.js` files follow this exact pattern with graceful shutdown:

### Structure
```javascript
require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT || [DEFAULT_PORT]);
let server;

async function bootstrap() {
  try {
    // Skip DB connection if explicitly disabled
    if (String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() !== 'true') {
      await connectDatabase();
    }

    // Start server and store reference
    server = app.listen(port, () => {
      console.log(`[service-name]-service listening on port ${port}`);
    });
  } catch (error) {
    console.error('[service-name]-service failed to start', error);
    process.exit(1);
  }
}

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  if (server) {
    server.close(() => {
      console.log('[service-name]-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  if (server) {
    server.close(() => {
      console.log('[service-name]-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

bootstrap();
```

### Key Points
- ✅ Server instance stored in variable
- ✅ Graceful shutdown on both SIGTERM and SIGINT
- ✅ Database connection skippable via `SKIP_DB_CONNECT` env var
- ✅ Consistent logging format
- ✅ Proper error exit codes

---

## 5. Error Handling Pattern

### error.middleware.js Structure
```javascript
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error('[Service Name] Error:', {
    status,
    message,
    path: req.originalUrl,
    method: req.method
  });
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err }),
  });
};

module.exports = { notFoundHandler, errorHandler };
```

### Key Points
- ✅ All routes return standardized JSON response
- ✅ Consistent error structure with `success`, `message`, and optional `data`
- ✅ HTTP status codes used appropriately
- ✅ Error details logged for debugging

---

## 6. Response Helper Pattern

### response.js Structure
```javascript
const attachResponseHelpers = (req, res, next) => {
  res.sendSuccess = (data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  res.sendError = (message = 'Error', statusCode = 500, error = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && error && { error }),
    });
  };

  next();
};

module.exports = { attachResponseHelpers };
```

### Usage in Controllers
```javascript
// Success response
res.sendSuccess({ userId: 123 }, 'User created', 201);

// Error response
res.sendError('User not found', 404);
```

---

## 7. Route Definition Pattern

### [feature].routes.js Structure
```javascript
const express = require('express');
const router = express.Router();
const [featureController] = require('../controllers/[feature].controller');
const { validate[Feature]Request } = require('../validators/[feature].validator');

// GET - Fetch all
router.get('/', [featureController].getAll);

// POST - Create new
router.post('/', validate[Feature]Request, [featureController].create);

// GET - Fetch by ID
router.get('/:id', [featureController].getById);

// PUT - Update by ID
router.put('/:id', validate[Feature]Request, [featureController].update);

// DELETE - Delete by ID
router.delete('/:id', [featureController].delete);

module.exports = router;
```

### Key Points
- ✅ Clear HTTP method usage (GET, POST, PUT, DELETE)
- ✅ Validation applied to mutation operations
- ✅ RESTful conventions followed
- ✅ Consistent naming patterns

---

## 8. Controller Pattern

### [feature].controller.js Structure
```javascript
const [Feature]Service = require('../services/[feature].service');

class [Feature]Controller {
  async getAll(req, res) {
    try {
      const items = await [Feature]Service.getAll();
      res.sendSuccess(items, '[Features] fetched successfully');
    } catch (error) {
      res.sendError(error.message, error.status || 500, error);
    }
  }

  async create(req, res) {
    try {
      const newItem = await [Feature]Service.create(req.body);
      res.sendSuccess(newItem, '[Feature] created successfully', 201);
    } catch (error) {
      res.sendError(error.message, error.status || 500, error);
    }
  }

  async getById(req, res) {
    try {
      const item = await [Feature]Service.getById(req.params.id);
      if (!item) {
        res.sendError('[Feature] not found', 404);
        return;
      }
      res.sendSuccess(item);
    } catch (error) {
      res.sendError(error.message, error.status || 500, error);
    }
  }

  // ... additional methods
}

module.exports = new [Feature]Controller();
```

### Key Points
- ✅ Async/await for cleaner error handling
- ✅ Try-catch blocks wrapping all operations
- ✅ Calls to service layer for business logic
- ✅ Uses `res.sendSuccess()` and `res.sendError()` helpers
- ✅ Singleton pattern for controller instance

---

## 9. Service Layer Pattern

### [feature].service.js Structure
```javascript
const [Feature]Model = require('../models/[feature].model');

class [Feature]Service {
  async getAll(filters = {}) {
    try {
      return await [Feature]Model.find(filters);
    } catch (error) {
      throw new Error(`Failed to fetch [features]: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const item = new [Feature]Model(data);
      return await item.save();
    } catch (error) {
      throw new Error(`Failed to create [feature]: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      return await [Feature]Model.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch [feature]: ${error.message}`);
    }
  }

  // ... additional methods
}

module.exports = new [Feature]Service();
```

### Key Points
- ✅ All business logic in service layer
- ✅ Database operations isolated
- ✅ Proper error handling and messages
- ✅ Singleton pattern for service instance

---

## 10. Model Definition Pattern

### [feature].model.js Structure
```javascript
const mongoose = require('mongoose');

const [feature]Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    // ... other fields
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes
[feature]Schema.index({ name: 1 });

// Add methods
[feature]Schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('[Feature]', [feature]Schema);
```

### Key Points
- ✅ Proper schema validation
- ✅ Timestamps automatically added
- ✅ Indexes for frequently queried fields
- ✅ toJSON method for response formatting

---

## 11. Environment Variables (.env file)

Each service requires these environment variables:

```env
# Port configuration
PORT=5002

# Database configuration
DB_HOST=localhost
DB_PORT=27017
DB_NAME=bajaj_mis
DB_USER=admin
DB_PASSWORD=secure_password

# Optional: Skip database connection for testing
SKIP_DB_CONNECT=false

# Environment
NODE_ENV=development

# Service Registry (if applicable)
SERVICE_REGISTRY_URL=http://localhost:8761

# Logging
LOG_LEVEL=info
```

---

## 12. Health Check Endpoint

Every service exposes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "[service-name]-service healthy",
  "data": {
    "service": "[service-name]-service"
  }
}
```

### Usage
- Load balancers use this for health monitoring
- Used for service discovery
- Can be called without authentication

---

## 13. CORS Configuration

Standard CORS setup for all services:
```javascript
app.use(cors({ origin: '*' }));
```

### For Production
Should be restricted to specific origins:
```javascript
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true 
}));
```

---

## 14. Request/Response Cycle

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response payload
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {} // Only in development
}
```

---

## 15. Validation Pattern

### [feature].validator.js Structure
```javascript
const validate[Feature]Request = (req, res, next) => {
  const { name, email } = req.body;

  // Validate required fields
  if (!name) {
    res.sendError('Name is required', 400);
    return;
  }

  if (!email) {
    res.sendError('Email is required', 400);
    return;
  }

  // Validate formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.sendError('Invalid email format', 400);
    return;
  }

  next();
};

module.exports = { validate[Feature]Request };
```

### Key Points
- ✅ Validation middleware placed before controller
- ✅ Clear error messages
- ✅ Appropriate HTTP status codes
- ✅ Input sanitization where needed

---

## 16. Testing Standards

### Unit Tests Pattern
```javascript
describe('[Feature] Service', () => {
  describe('getAll', () => {
    it('should return all items', async () => {
      // Mock setup
      const mockData = [{ id: 1, name: 'Test' }];
      
      // Execute
      const result = await [Feature]Service.getAll();
      
      // Assert
      expect(result).toEqual(mockData);
    });
  });
});
```

### Integration Tests Pattern
```javascript
describe('[Feature] API', () => {
  describe('GET /api/[route]', () => {
    it('should return 200 with items', async () => {
      const response = await request(app)
        .get('/api/[route]')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
```

---

## 17. Logging Standards

### Logging Format
```javascript
// Success
console.log(`[Service] Operation completed`, { 
  userId: 123, 
  timestamp: new Date() 
});

// Error
console.error(`[Service] Error description`, { 
  error: error.message, 
  stack: error.stack,
  timestamp: new Date() 
});
```

### Structured Logging
- Use consistent prefixes: `[ServiceName]`
- Include relevant context (IDs, user info)
- Include timestamps
- Use appropriate log levels

---

## 18. API Versioning (Optional)

For API versioning, use route prefixes:

```javascript
// Version 1
app.use('/api/v1/[route]', require('./src/routes/v1/[route].routes'));

// Version 2
app.use('/api/v2/[route]', require('./src/routes/v2/[route].routes'));
```

---

## 19. Security Best Practices

### Implemented Security Headers
```javascript
// X-Content-Type-Options: Prevents MIME sniffing
res.setHeader('X-Content-Type-Options', 'nosniff');

// X-Frame-Options: Prevents clickjacking
res.setHeader('X-Frame-Options', 'DENY');

// X-XSS-Protection: Enables browser XSS protection
res.setHeader('X-XSS-Protection', '1; mode=block');
```

### Additional Recommendations
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Validate all inputs (never trust user input)
- ✅ Use parameterized queries to prevent SQL injection
- ✅ Store sensitive data encrypted
- ✅ Implement proper authentication and authorization
- ✅ Use environment variables for secrets
- ✅ Log security events
- ✅ Regular security audits

---

## 20. Git Workflow Standards

### Branch Naming
- Feature: `feature/[feature-name]`
- Bug fix: `bugfix/[bug-name]`
- Release: `release/[version]`

### Commit Message Format
```
[COMPONENT] Brief description

Detailed description if needed.

Fixes #123
```

Example:
```
[Tracking Service] Add vehicle location tracking

- Implemented real-time location tracking
- Added geofencing capabilities
- Updated database schema

Fixes #456
```

---

## 21. Deployment Checklist

Before deploying a service:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Health check verified
- [ ] CORS origins updated for production
- [ ] Logging configured properly
- [ ] Error handling verified
- [ ] Performance tested
- [ ] Security review complete
- [ ] Documentation updated
- [ ] Rollback plan ready

---

## 22. Monitoring & Observability

### Metrics to Track
- Request count by endpoint
- Response time (latency)
- Error rate
- Database query performance
- Service availability uptime

### Health Checks
Regular health monitoring endpoints:
```
GET /api/health
```

### Logging Aggregation
All services should log to a centralized system:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch

### Key Information to Log
- Request ID (for tracing)
- User ID
- Operation performed
- Performance metrics
- Errors and exceptions

---

## 23. Common Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry or state conflict |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Service temporarily down |

---

## 24. Database Connection Pattern

### database.js Structure
```javascript
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectDatabase;
```

---

## 25. Service Communication Pattern

### Service-to-Service Calls
```javascript
const axios = require('axios');

class ServiceClient {
  constructor(baseURL) {
    this.client = axios.create({ baseURL });
  }

  async callService(endpoint, method = 'GET', data = null) {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        data,
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Service call failed: ${error.message}`);
    }
  }
}

module.exports = ServiceClient;
```

---

## Compliance & Updates

- **Last Updated**: [Current Date]
- **Version**: 1.0
- **Maintainer**: Dev Team

For questions or suggestions, please raise a GitHub issue or contact the development team.

