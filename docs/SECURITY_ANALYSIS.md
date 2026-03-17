# Security Analysis Report - Bajaj MIS MERN Project

*Generated: March 16, 2026*

## Executive Summary

This Bajaj MIS MERN project implements a **microservices-based architecture** with **multiple layers of security controls**. The security approach focuses on:
- JWT-based authentication
- Role-based authorization (RBAC)
- Password hashing with bcryptjs
- CORS protection
- Input validation with Zod schemas
- Centralized error handling

---

## 1. Authentication System

### 1.1 JWT Token-Based Authentication

**Implementation:**
- **Library Used:** `jsonwebtoken` (v9.0.2)
- **Secret Management:** Environment variables (`APP_JWT_SECRET` or `JWT_SECRET`)
- **Token Expiry:** Default 24 hours, configurable via `JWT_EXPIRES_IN`
- **Token Format:** Bearer token in `Authorization` header

**Token Structure:**
```javascript
{
  id: user.id,
  userId: user.userid,
  utid: user.UTID,
  name: user.Name,
  factId: user.FactID,
  season: user.season
}
```

**Location:** [backend/shared/lib/middleware/auth.middleware.js](backend/shared/lib/middleware/auth.middleware.js#L1-L40)

---

## 2. Password Security

### 2.1 Password Hashing

**Implementation:**
- **Library Used:** `bcryptjs` (v2.4.3)
- **Hashing Rounds:** 10 (default, configurable via `BCRYPT_ROUNDS`)
- **Location:** [backend/services/auth-service/src/services/auth.service.js](backend/services/auth-service/src/services/auth.service.js#L1-L50)

**Security Features:**
- ✅ Passwords are salted and hashed
- ✅ Minimum password length: 6 characters
- ✅ Legacy password migration support (gradual migration from plaintext)

**Password Change:**
- Old password verification required
- New password confirmation required
- Endpoint: `POST /api/account/change-password-2`

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)

**Implementation:**
- **API Gateway Enforcement:** Central authentication point
- **User Context Propagation:** Via HTTP headers
  - `x-user-id` - User identifier
  - `x-user-name` - User name
  - `x-user-utid` - User type/role identifier
  - `x-user-fact-id` - Factory ID
  - `x-user-season` - Season context (business year)

**Location:** [backend/services/api-gateway/src/middleware/auth.middleware.js](backend/services/api-gateway/src/middleware/auth.middleware.js#L1-L80)

### 3.2 Protected Routes

**Auth-Required Routes:**
- `/api/user-management` - User management
- `/api/dashboard` - Dashboard operations
- `/api/report` - Report generation
- `/api/lab` - Lab operations
- `/api/distillery` - Distillery operations
- `/api/tracking` - Tracking services
- `/api/survey-report` - Survey reports
- `/api/whats-app` - WhatsApp integration

**Public Routes:**
- `/api/account/login-2` - Login
- `/api/account/verify` - Token verification
- `/api/account/change-password-2` - Password change
- `/api/health` - Health checks

---

## 4. API Gateway Security

### 4.1 CORS (Cross-Origin Resource Sharing)

**Implementation:**
```javascript
CORS Configuration:
- Allowed Origins: Configurable via CORS_ORIGINS env variable
- Development: Localhost dynamic matching
- Production: Whitelist-based validation
```

**Location:** [backend/services/api-gateway/src/app.js](backend/services/api-gateway/src/app.js#L1-L35)

### 4.2 Request Size Limits

```javascript
- JSON payload limit: 2MB (API Gateway)
- Urlencoded limit: 5MB (Auth Service)
```

### 4.3 Token Caching

**Cache TTL:** 30 seconds (configurable via `AUTH_CACHE_TTL_MS`)
**Purpose:** Reduce load on auth service for frequent verification

---

## 5. Input Validation

### 5.1 Schema Validation with Zod

**Framework:** Zod (v4.3.6) - TypeScript-first schema validation

**Validated Endpoints:**
1. **Login**
   - `userId` (required, min 1 character)
   - `password` (required, min 1 character)
   - `season` (optional)

2. **Change Password**
   - `userId` (required)
   - `oldPassword` vs `newPassword` comparison
   - `newPassword` === `confirmPassword` validation

3. **Page Load**
   - `userId` (optional)
   - `utid` (required)
   - `season` (optional)

**Location:** [backend/services/auth-service/src/validations/auth.validation.js](backend/services/auth-service/src/validations/auth.validation.js#L1-L100)

---

## 6. Database Security

### 6.1 Connection Methods

**Supported Authentication:**
- Windows Authentication (Trusted Connection)
- SQL Server Authentication (username/password)

**Connection Configuration:**
- Pool size: 2-10 connections
- Connection timeout: 30 seconds
- Request timeout: 5 minutes

**Location:** [backend/shared/config/database.js](backend/shared/config/database.js#L1-L80)

### 6.2 Database Credentials

**Managed via Environment Variables:**
```bash
DB_SERVER          # SQL Server address
DB_PORT           # SQL Server port
DB_INSTANCE       # Named instance (for Windows)
DB_NAME           # Database name
DB_USE_WINDOWS_AUTH # Use Windows Authentication
SQL_CONN_2021     # Season-specific connection string
SQL_CONN_2122
SQL_CONN_2223
SQL_CONN_2324
SQL_CONN_2425
SQL_CONN_2526
```

### 6.3 Multi-Season Support

**Architecture:**
- Separate data per business season
- Season routing via environment variables
- Default season: 2526 (fallback)

---

## 7. Error Handling & Logging

### 7.1 Centralized Error Handler

**Features:**
- Standardized error response format
- HTTP status code validation
- Server error logging (5xx)
- Request ID tracking

**Response Format:**
```javascript
{
  success: false,
  message: "Error description",
  data: null,
  error: "ERROR_CODE",
  timestamp: "ISO-8601 timestamp",
  requestId: "unique-request-id"
}
```

**Location:** [backend/shared/middleware/error.middleware.js](backend/shared/middleware/error.middleware.js#L1-L50)

### 7.2 Request Logging

- Method, path, status code logged
- User ID tracked
- IP address captured
- Failed login attempts logged (debug mode)

---

## 8. Frontend Security (React)

### 8.1 Protected Routes

**Component:** [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)

```javascript
- Token check: localStorage.getItem('token')
- Redirect to /login if not authenticated
- Router-based access control
```

### 8.2 Token Storage

**Current Approach:** `localStorage`

```javascript
localStorage.setItem('token', jwtToken)
const token = localStorage.getItem('token')
```

### 8.3 HTTP Client

**Library:** Axios (v1.13.6)
- Token automatically sent in Authorization header
- Error handling for 401 responses

---

## 9. Security Configuration Constants

**Location:** [backend/shared/config/constants.js](backend/shared/config/constants.js#L1-L80)

```javascript
SECURITY: {
  BCRYPT_ROUNDS: 10,                    // Password hashing rounds
  JWT_EXPIRY_DEFAULT: '24h',            // Token expiration
  PASSWORD_MIN_LENGTH: 6,               // Minimum password length
  SESSION_TIMEOUT_MS: 86400000          // 24 hours
}

RATE_LIMIT: {
  WINDOW_MS: 60000,                     // 1 minute window
  MAX_REQUESTS: 300,                    // 300 requests per minute
  LOGIN_WINDOW_MS: 900000,              // 15 minutes
  LOGIN_MAX_ATTEMPTS: 5                 // 5 failed attempts
}
```

---

## 10. Security Issues & Recommendations

### ⚠️ CRITICAL Issues

**1. Default JWT Secret in Development**
- **Issue:** Default secret "change_me_in_production" used when env var not set
- **Risk:** Token forgery if not changed in production
- **Recommendation:** 
  ```bash
  APP_JWT_SECRET=<strong-random-string>  # Set in production
  ```
- **Reference:** [backend/shared/lib/middleware/auth.middleware.js](backend/shared/lib/middleware/auth.middleware.js#L18)

**2. Token Storage in localStorage (XSS Vulnerable)**
- **Issue:** Stored in plain localStorage, accessible to XSS attacks
- **Risk:** Malicious scripts can steal tokens
- **Recommendation:** 
  - Use HttpOnly cookies (server-set, not accessible to JS)
  - Implement CSRF tokens
  - Add Content Security Policy (CSP) headers

---

### ⚠️ HIGH Priority

**3. Rate Limiting Not Implemented**
- **Issue:** Rate limiting configured but not actively enforced
- **Risk:** Brute force attacks on login endpoint
- **Recommendation:**
  - Implement express-rate-limit middleware
  - Apply to login: 5 attempts per 15 minutes
  - Apply to general endpoints: 300 per minute

**4. Missing Helmet.js Security Headers**
- **Issue:** No HTTP security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **Risk:** Clickjacking, MIME sniffing attacks
- **Recommendation:**
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

**5. No Explicit Input Sanitization**
- **Issue:** XSS protection relies only on JSON validation
- **Risk:** Stored XSS if frontend renders unsanitized data
- **Recommendation:**
  - Use DOMPurify for frontend rendering
  - Sanitize user inputs server-side

---

### 🔶 MEDIUM Priority

**6. No HTTPS Enforcement**
- **Issue:** No mention of HTTPS/TLS configuration
- **Risk:** Man-in-the-middle attacks
- **Recommendation:**
  - Use HTTPS/TLS in production
  - Set HSTS header
  - Enforce secure cookies

**7. Password Minimum Length Too Short**
- **Issue:** 6 characters minimum is below OWASP recommendations
- **Risk:** Weak passwords easily cracked
- **Recommendation:**
  - Increase to 12 characters minimum
  - Enforce complexity requirements (uppercase, numbers, special chars)

**8. No SQL Injection Prevention Explicitly Documented**
- **Issue:** Query execution mechanism not explicitly documented as using parameterized queries
- **Risk:** SQL injection vulnerability
- **Recommendation:**
  - Verify mssql library uses parameterized queries
  - Document prepared statement usage
  - Add input validation for SQL parameters

---

### 🟡 LOW Priority

**9. Session Timeout Not Enforced Client-Side**
- **Issue:** 24-hour session timeout set but not enforced on frontend
- **Risk:** Inactive sessions remain valid
- **Recommendation:**
  - Implement frontend session timeout
  - Clear token after inactivity
  - Warn user before timeout

**10. No Audit Logging**
- **Issue:** No persistent audit trail for security events
- **Risk:** Cannot track unauthorized access attempts
- **Recommendation:**
  - Log all authentication events
  - Log role/permission changes
  - Implement audit compliance

---

## 11. Microservices Security Architecture

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Frontend                  │
│    (Token in localStorage)              │
└──────────────┬──────────────────────────┘
               │ JWT Token
┌──────────────▼──────────────────────────┐
│     API Gateway (Port 3000)             │
│  - CORS validation                      │
│  - Bearer token verification            │
│  - User context extraction              │
│  - Route forwarding                     │
└──────────────┬──────────────────────────┘
               │ x-user-* headers
       ┌───────┴──────────────────┐
       │                          │
   ┌───▼────────────┐    ┌───────▼────────────┐
   │ Auth Service   │    │ Other Services     │
   │ - Login        │    │ - Dashboard        │
   │ - Verify       │    │ - Report           │
   │ - Change Pwd   │    │ - Lab              │
   │ - Permissions  │    │ - Distillery       │
   └─────┬──────────┘    └───────┬────────────┘
         │                       │
         │                       │
   ┌─────▼───────────────────────▼───────┐
   │     SQL Server Database             │
   │   (Multi-season architecture)       │
   └─────────────────────────────────────┘
```

---

## 12. Security Checklist

| Category | Status | Notes |
|----------|--------|-------|
| **Authentication** | ✅ Implemented | JWT-based with 24h expiry |
| **Password Hashing** | ✅ Implemented | Bcryptjs 10 rounds |
| **Authorization** | ✅ Implemented | RBAC via API Gateway |
| **CORS** | ✅ Implemented | Whitelist-based |
| **Input Validation** | ✅ Implemented | Zod schemas |
| **Error Handling** | ✅ Implemented | Centralized |
| **Rate Limiting** | ⚠️ Configured Only | NOT enforced |
| **HTTPS/TLS** | ❌ Not Configured | Needs implementation |
| **Security Headers** | ❌ Not Implemented | Missing helmet |
| **XSS Protection** | ⚠️ Partial | Validation only |
| **CSRF Protection** | ❌ Not Configured | Needs tokens |
| **Audit Logging** | ❌ Not Configured | Needs implementation |
| **Password Policy** | ⚠️ Weak | 6 chars minimum |
| **HttpOnly Cookies** | ❌ Using localStorage | XSS risk |

---

## 13. Environment Variables Required

```bash
# Authentication
APP_JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# Database
DB_SERVER=<sql-server-address>
DB_PORT=1433
DB_INSTANCE=<optional-instance-name>
DB_NAME=<database-name>
DB_USE_WINDOWS_AUTH=false
SQL_CONN_2526=<connection-string>
SQL_CONN_DEFAULT=<connection-string>

# API Gateway
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
AUTH_SERVICE_URL=http://localhost:3001
AUTH_CACHE_TTL_MS=30000

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=production
LOG_LEVEL=info
DEFAULT_SEASON=2526
```

---

## 14. Deployment Recommendations

### Production Security Checklist

Before deploying to production:

- [ ] Set all environment variables securely
- [ ] Change JWT secret from default
- [ ] Set minimum password length to 12
- [ ] Implement and test rate limiting
- [ ] Configure HTTPS/TLS certificates
- [ ] Add helmet.js security headers
- [ ] Enable audit logging
- [ ] Implement CSRF tokens
- [ ] Switch from localStorage to HttpOnly cookies
- [ ] Add WAF (Web Application Firewall)
- [ ] Implement DDoS protection
- [ ] Set up security monitoring/alerting
- [ ] Conduct penetration testing
- [ ] Review database permissions (least privilege)
- [ ] Implement secrets management (Vault, etc.)

---

## 15. Compliance & Standards

**Frameworks Referenced:**
- OWASP Top 10
- OAuth 2.0 / OpenID Connect (JWT standard)
- NIST Cybersecurity Framework

**Recommended Additional Security:**
- PCI DSS (if handling payment data)
- GDPR (if handling EU user data)
- SOC 2 compliance

---

## Conclusion

The **Bajaj MIS MERN project implements a solid foundation of authentication and authorization** using JWT tokens, bcryptjs hashing, and API Gateway-based access control. However, several **critical and high-priority security enhancements** are needed for production deployment, particularly:

1. ✅ JWT authentication ← **Good**
2. ✅ Password hashing ← **Good**
3. ✅ CORS protection ← **Good**
4. ❌ Rate limiting not enforced ← **Needs Fix**
5. ❌ Token in localStorage ← **XSS Risk**
6. ❌ No security headers ← **Needs Fix**

**Estimated Effort:** 2-3 weeks for full security hardening

---

*Report prepared for security audit and compliance purposes.*
