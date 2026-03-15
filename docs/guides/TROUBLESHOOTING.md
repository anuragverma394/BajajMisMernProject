# Microservices Troubleshooting & Common Issues Guide

**Version**: 1.0  
**Updated**: January 2026  
**Applies to**: All standardized services

---

## Quick Diagnosis

### Is Service Running?
```bash
# Check process
ps aux | grep node
ps aux | grep "[service-name]"

# Check port listening
netstat -tlnp | grep 5000
lsof -i :5000

# Test connection
curl http://localhost:5000/api/health
```

### Is Database Connected?
```bash
# Check connection string
echo $DB_HOST, $DB_PORT, $DB_NAME

# Test database directly
mongo --host $DB_HOST -u $DB_USER -p $DB_PASSWORD

# Check logs
docker logs [service-name]
```

---

## Common Issues & Solutions

### Issue 1: "Port already in use"

**Error Message:**
```
Error: listen EADDRINUSE :::5000
```

**Causes:**
- Another process using the port
- Service didn't shutdown properly
- Wrong PORT in .env

**Solution:**
```bash
# 1. Kill existing process
kill -9 $(lsof -t -i:5000)

# 2. Or find and kill by name
pkill -f "node.*server.js"

# 3. Verify port is free
netstat -tlnp | grep 5000  # Should return nothing

# 4. Use different port if needed
PORT=5001 npm start
```

---

### Issue 2: "ECONNREFUSED - Database Connection Failed"

**Error Message:**
```
MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causes:**
- MongoDB not running
- Wrong DB_HOST or DB_PORT
- Wrong credentials (DB_USER, DB_PASSWORD)
- Network connectivity issue

**Solution:**
```bash
# 1. Check MongoDB running
sudo systemctl status mongod

# 2. Start if not running
sudo systemctl start mongod

# 3. Verify connection details
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Name: $DB_NAME"
echo "User: $DB_USER"

# 4. Test connection directly
mongo --host $DB_HOST:$DB_PORT -u $DB_USER -p $DB_PASSWORD

# 5. Skip DB connection for testing
SKIP_DB_CONNECT=true npm start

# 6. Check firewall
sudo ufw status
sudo ufw allow 27017
```

---

### Issue 3: "Health Check Returns 404"

**Error Message:**
```
curl http://localhost:5000/api/health
404 Not Found
```

**Causes:**
- Wrong port number
- Service not started
- Security headers interfering (unlikely)
- Route prefix wrong

**Solution:**
```bash
# 1. Verify service running
ps aux | grep node

# 2. Verify correct port
echo $PORT
curl http://localhost:5000/api/health

# 3. Check app.js for health route
grep -n "api/health" app.js

# 4. Check service name in route
# Should be: GET /api/health

# 5. Restart service
npm start
```

**Example Health Check Output:**
```bash
curl http://localhost:5002/api/health
{
  "success": true,
  "message": "user-service-service healthy",
  "data": { "service": "user-service-service" }
}
```

---

### Issue 4: "SIGTERM/SIGINT Not Gracefully Shutting Down"

**Symptoms:**
- Service exits abruptly
- Connections not closed
- "Error: write EPIPE" messages
- Database transactions rolled back

**Causes:**
- Server instance not stored in variable
- Signal handlers not implemented
- Missing next() in middleware

**Solution:**

**Check server.js has:**
```javascript
let server;  // ✅ MUST be here

async function bootstrap() {
  try {
    // ...
    server = app.listen(port, () => {  // ✅ Assign to variable
      console.log(`listening on port ${port}`);
    });
  } catch (error) {
    console.error('failed to start', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {  // ✅ Handle SIGTERM
  console.log('SIGTERM received');
  if (server) {
    server.close(() => {
      console.log('shut down');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {  // ✅ Handle SIGINT (Ctrl+C)
  console.log('SIGINT received');
  if (server) {
    server.close(() => {
      console.log('shut down');
      process.exit(0);
    });
  }
});

bootstrap();
```

**Test graceful shutdown:**
```bash
# Terminal 1: Start service
npm start

# Terminal 2: Send SIGTERM
kill -SIGTERM <pid>

# Should see:
# "SIGTERM received, shutting down"
# "[service]-service shut down"
# Exit code 0
```

---

### Issue 5: "CORS Error - Blocked by browser"

**Error Message:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/endpoint'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causes:**
- CORS not properly configured
- Credentials not handled correctly
- Origin mismatch

**Solution:**

**Development (current):**
```javascript
app.use(cors({ origin: '*' }));  // ✅ Allows all origins
```

**Production (should be):**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// .env file:
// ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

**Test CORS:**
```bash
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:5000/api/endpoint
```

---

### Issue 6: "Middleware Applied Out of Order"

**Symptoms:**
- Body parsing not working (req.body undefined)
- Security headers not applied
- Error handlers not catching errors

**Causes:**
- Middleware in wrong order in app.js
- Routes before middleware
- Error handlers not last

**Solution:**

**Correct order in app.js:**
```javascript
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
app.get('/api/health', (req, res) => { ... });

// 6️⃣ Routes
app.use('/api/endpoint', require('./src/routes/...'));

// 7️⃣ Error handlers (LAST)
app.use(notFoundHandler);
app.use(errorHandler);
```

---

### Issue 7: "req.body is undefined"

**Error Message:**
```
TypeError: Cannot read property 'field' of undefined
```

**Causes:**
- Body parsing middleware not applied
- POST body empty
- Wrong Content-Type header
- Body parsing middleware after route

**Solution:**
```bash
# 1. Verify middleware order (see Issue 6)

# 2. Test with proper Content-Type
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'

# 3. Check req.body exists
console.log('Body:', req.body);  // Should not be undefined

# 4. Verify JSON parsing
app.use(express.json({ limit: '5mb' }));
```

---

### Issue 8: "Cannot find module - require() error"

**Error Message:**
```
Error: Cannot find module './src/routes/...routes'
```

**Causes:**
- File doesn't exist
- Wrong path
- Wrong filename
- File extension issues

**Solution:**
```bash
# 1. Verify file exists
ls -la src/routes/

# 2. Check exact filename
# Should match require statement exactly

# 3. Check path
# Current: require('./src/routes/[feature].routes')
# Check: ./src/routes/[feature].routes.js exists

# 4. Verify export
# At end of file: module.exports = router;
```

---

### Issue 9: "No route matching - 404 on valid endpoint"

**Symptoms:**
- Valid endpoint returns 404
- Other endpoints work
- Route definition seems correct

**Causes:**
- Wrong route path prefix
- Route not mounted in app.js
- Typo in route
- Case sensitivity

**Solution:**
```bash
# 1. Verify route mounted in app.js
grep -n "app.use" app.js

# 2. Check path matches
# Route: '/api/feature'
# Test: curl http://localhost:5000/api/feature

# 3. Case sensitivity (Linux is case-sensitive)
# Wrong: /API/feature (wrong case)
# Right: /api/feature (correct case)

# 4. Check routes directory
ls -la src/routes/

# 5. Verify route export
tail -1 src/routes/[feature].routes.js
# Should show: module.exports = router;
```

---

### Issue 10: "Errors not being caught - response hanging"

**Symptoms:**
- Request hangs
- "Cannot set headers after they are sent" error
- Response stuck

**Causes:**
- No try-catch in controller
- Sending response twice
- Missing error handler
- next() called with no middleware

**Solution:**

**Correct pattern in controller:**
```javascript
async create(req, res) {
  try {
    // ✅ Do work
    const result = await Service.create(req.body);
    
    // ✅ Send response ONCE
    res.sendSuccess(result, 'Created', 201);
  } catch (error) {
    // ✅ Handle error
    res.sendError(error.message, 500, error);
  }
  // ✅ Don't send response again after!
}
```

---

### Issue 11: "Service doesn't startup - "bootstrap() is not a function"

**Error Message:**
```
TypeError: bootstrap is not a function
```

**Causes:**
- bootstrap not defined
- Function definition error
- Syntax error

**Solution:**
```javascript
// ✅ CORRECT:
async function bootstrap() {
  try {
    // ...
  } catch (error) {
    // ...
  }
}

bootstrap();

// ❌ WRONG:
function bootstrap() {  // Missing 'async'
  // ...
}

bootstrap()
// Missing semicolon/parentheses
```

---

### Issue 12: "Cannot destructure from require"

**Error Message:**
```
const { attachResponseHelpers } = require('./...');
TypeError: Cannot destructure property
```

**Causes:**
- Module doesn't export correctly
- Wrong export syntax
- Module doesn't have that export

**Solution:**

**Check export in response.js:**
```javascript
// ✅ CORRECT:
module.exports = { attachResponseHelpers };

// Or use named exports:
exports.attachResponseHelpers = (req, res, next) => { ... };

// ❌ WRONG:
module.exports = attachResponseHelpers;  // Missing braces
```

---

### Issue 13: "Validation not working - fields accepted without checks"

**Symptoms:**
- Invalid data accepted
- Validation middleware ignored
- No validation errors returned

**Causes:**
- Validation middleware not applied to route
- Validation function not called next()
- Validation not actually validating

**Solution:**

**Check route.js:**
```javascript
// ✅ CORRECT:
router.post('/', validateInput, controller.create);

// ❌ WRONG:
router.post('/', controller.create);  // Missing validation
```

**Check validator.js:**
```javascript
const validateInput = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    res.sendError('Email required', 400);
    return;  // ✅ STOP here
  }
  
  next();  // ✅ ONLY if valid
};
```

---

### Issue 14: "Database query returning empty but data exists"

**Symptoms:**
- Query returns empty array
- Data should exist
- Other queries work

**Causes:**
- Wrong query syntax
- MongoDB connection not ready
- Typo in field name
- Document doesn't match filter

**Solution:**
```javascript
// 1. Check database connection
// Add to error handler
if (error.message.includes('ECONNREFUSED')) {
  console.error('Database not connected!');
}

// 2. Verify field names match schema
// Schema: firstName
// Query: first_name (❌ WRONG)

// 3. Test query in MongoDB
mongo --host $DB_HOST -u $DB_USER -p $DB_PASSWORD
> use bajaj_mis
> db.users.findOne({ email: 'test@test.com' })

// 4. Add logging
console.log('Query:', JSON.stringify(filter));
console.log('Results:', results);
```

---

### Issue 15: "500 Internal Server Error with no details"

**Symptoms:**
- Returns 500 status
- No error message
- Can't debug

**Causes:**
- Error details stripped
- Error handler not logging
- Wrong error type

**Solution:**

**Enable detailed errors in development:**
```javascript
// In error.middleware.js
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // ✅ Log for debugging
  console.error('[ERROR]', {
    status,
    message,
    stack: err.stack,  // Full error trace
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(status).json({
    success: false,
    message,
    // ✅ Include in development only
    ...(process.env.NODE_ENV === 'development' && { 
      error: {
        message: err.message,
        stack: err.stack
      }
    }),
  });
};
```

---

## Debugging Techniques

### 1. Add Console Logging
```javascript
// Controller
console.log('Request received:', req.body);
console.log('Processing...', result);
console.log('Response sent');
```

### 2. Use Node Debugger
```bash
# Terminal
node --inspect server.js

# Browser
chrome://inspect
```

### 3. Check Logs
```bash
# Docker logs
docker logs [service-name] --tail 100 -f

# File logs
tail -f logs/app.log

# System logs
journalctl -u [service-name] -f
```

### 4. Use curl for API Testing
```bash
# GET
curl http://localhost:5000/api/endpoint

# POST
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'

# With headers
curl -H "Authorization: Bearer token" \
  http://localhost:5000/api/endpoint

# Include response headers
curl -i http://localhost:5000/api/endpoint
```

### 5. Monitor Resource Usage
```bash
# CPU and Memory
top
top -p $(pgrep -f "node.*server.js")

# Open files
lsof -p $(pgrep -f "node.*server.js")

# Network connections
netstat -tlnp | grep node
```

---

## Performance Issues

### Issue: "Service is slow - latency high"

**Diagnosis:**
```bash
# 1. Check response time
curl -w "@-" -o /dev/null -s "http://localhost:5000/api/endpoint" << 'EOF'
time_total: %{time_total}
time_connect: %{time_connect}
time_starttransfer: %{time_starttransfer}
EOF

# 2. Check database query time
# Add timing in service
const start = Date.now();
const result = await Model.find(...);
console.log(`Query took ${Date.now() - start}ms`);
```

**Solutions:**
- Add database indexes
- Optimize queries
- Implement caching
- Profile code
- Check memory usage
- Increase database pool size

---

## Security Issues

### Sensitive Data in Logs
```bash
# ❌ DON'T
console.log('User:', user);  // May include passwords

# ✅ DO
console.log('User created:', { id: user.id, email: user.email });
```

### SQL Injection
```javascript
// ❌ DANGEROUS
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ SAFE
const query = `SELECT * FROM users WHERE id = ?`;
execute(query, [userId]);
```

---

## Environment Configuration Issues

### Missing Environment Variable
```bash
# Error: Cannot read property 'split' of undefined

# Solution:
# 1. Check .env file exists
ls -la .env

# 2. Check variable is set
echo $DB_HOST

# 3. Load environment
source .env
# or
export $(cat .env | xargs)
```

---

## Docker-Specific Issues

### Container exits immediately
```bash
# Check logs
docker logs [container-id]

# Run with interactive terminal
docker run -it [image] /bin/bash

# Check if process exits
docker ps -a | grep [service]
```

### Can't connect to database from container
```bash
# Use service name instead of localhost
# ❌ WRONG (in container)
DB_HOST=localhost

# ✅ RIGHT (in container Docker network)
DB_HOST=mongo
# or
DB_HOST=mongodb_service
```

---

## Getting Help

### Information to Include in Issue Report:
1. Error message (full)
2. Service name and port
3. What you were trying to do
4. Steps to reproduce
5. Environment (development/staging/production)
6. Relevant logs
7. What you already tried

### Example Issue Report:
```
**Title**: survey-service health check returns 404

**Environment**: Development

**Error Message**:
curl http://localhost:5006/api/health
404 Not Found

**Steps to Reproduce**:
1. npm start in survey-service
2. curl http://localhost:5006/api/health

**Expected**: 
{ "success": true, "message": "survey-service healthy" }

**Actual**:
404 Not Found

**Already Tried**:
- Verified port in .env
- Checked app.js for route
- Restarted service

**Logs**:
[service logs here]
```

---

## Quick Fixes (Copy-Paste)

### Reset Service
```bash
# Kill and restart
pkill -f "node.*[service-name]"
sleep 2
npm start
```

### Clear Node Cache
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Reset Database
```bash
mongo --host $DB_HOST -u $DB_USER -p $DB_PASSWORD
> use bajaj_mis
> db.dropDatabase()
> exit
```

### Check All Services Running
```bash
# Check all ports
netstat -tlnp | grep node

# Should show:
# 5002 - user-service
# 5005 - lab-service
# 5006 - survey-service
# 5007 - tracking-service
# 5008 - distillery-service
# 5009 - whatsapp-service
```

---

## Reference

- **Standards Document**: `/backend/SERVICE_STANDARDS.md`
- **Quick Guide**: `/backend/QUICK_REFERENCE_GUIDE.md`
- **Completion Report**: `/backend/STANDARDIZATION_COMPLETION_REPORT.md`

---

**Last Updated**: January 2026  
**Version**: 1.0  

💡 **Tip**: Bookmark this page for quick reference!

